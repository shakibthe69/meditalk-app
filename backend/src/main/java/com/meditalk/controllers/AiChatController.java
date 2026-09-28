package com.meditalk.controllers;

import com.meditalk.dto.AiChatRequest;
import com.meditalk.dto.AiChatResponse;
import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.MedicineResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.GeminiAiChatService;
import com.meditalk.services.HealthChatContextService;
import com.meditalk.services.HealthChatFallbackService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private static final Logger log = LoggerFactory.getLogger(AiChatController.class);

    private final GeminiAiChatService geminiService;
    private final HealthChatContextService contextService;
    private final HealthChatFallbackService fallbackService;

    public AiChatController(GeminiAiChatService geminiService,
                            HealthChatContextService contextService,
                            HealthChatFallbackService fallbackService) {
        this.geminiService = geminiService;
        this.contextService = contextService;
        this.fallbackService = fallbackService;
    }

    /**
     * Health AI chat.
     *
     * <p>The patient is identified from the JWT only (never from the request body) and
     * their confirmed medication records are added as context. If the generative AI is
     * unreachable, the request is still answered by the server-side health engine, so
     * the chat never dead-ends. The AI credential stays on the server.</p>
     */
    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(
            @Valid @RequestBody AiChatRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        String language = request.getLanguage() != null ? request.getLanguage() : "en";
        Long userId = principal != null ? principal.getId() : null;

        List<MedicineResponse> medicines = contextService.getActiveMedicines(userId);
        String medicationContext = contextService.buildMedicationContext(medicines);

        GeminiAiChatService.ChatResult result =
                geminiService.chat(request.getMessage(), language, medicationContext);

        if (result.getText() != null && !result.getText().isBlank()) {
            AiChatResponse response = new AiChatResponse(result.getText(), language, "gemini");
            return ResponseEntity.ok(ApiResponse.success(response, "AI response generated"));
        }

        // The AI provider is unavailable. Answer from the server-side health engine
        // instead of returning a dead end, and keep the reason in the logs.
        log.warn("Health AI unavailable ({}); answering from the offline health engine.",
                result.getErrorMessage());

        HealthChatFallbackService.Answer answer =
                fallbackService.answer(request.getMessage(), language, medicines);

        AiChatResponse response = new AiChatResponse(answer.getText(), language, "knowledge");
        return ResponseEntity.ok(ApiResponse.success(response, "Health guidance"));
    }

    /**
     * Operator diagnostics: shows whether a health-chat credential is configured and why
     * the last AI call failed. Never returns a key or any patient data.
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        return ResponseEntity.ok(ApiResponse.success(geminiService.status()));
    }
}
