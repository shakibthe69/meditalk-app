package com.meditalk.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * MediTalk Health AI chat backed by Gemini.
 *
 * <p>This service uses the dedicated health-chat credential
 * ({@code HEALTH_CHAT_GEMINI_API_KEY}), which is deliberately separate from the
 * prescription-extraction credential. Keys stay server-side only.</p>
 *
 * <p>If the patient is authenticated, the caller may pass a short summary of their
 * confirmed medication records as context. Raw OCR text is never sent.</p>
 */
@Service
public class GeminiAiChatService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiChatService.class);
    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${app.gemini.health-chat-api-key:}")
    private String healthChatApiKey;

    @Value("${app.gemini.api-key:}")
    private String sharedApiKey;

    @Value("${app.gemini.health-chat-model:}")
    private String healthChatModel;

    @Value("${app.gemini.model:gemini-3.8-flash}")
    private String primaryModel;

    @Value("${app.gemini.fallback-models:}")
    private String fallbackModelsRaw;

    @Value("${app.gemini.max-output-tokens:800}")
    private int maxOutputTokens;

    @Value("${app.gemini.temperature:0.3}")
    private double temperature;

    @Value("${app.gemini.timeout-seconds:45}")
    private int timeoutSeconds;

    private static final String SYSTEM_PROMPT_EN =
            "You are the MediTalk AI Health Assistant. You are an information assistant, not a doctor.\n"
            + "Guidelines:\n"
            + "- Give accurate, compassionate, easy-to-understand general health information in English.\n"
            + "- Explain medical terms in simple language and help the patient understand their medicines.\n"
            + "- When the patient asks about their own medicines, use only the confirmed medication list supplied below, if any.\n"
            + "- Never invent patient details, test results, dosages or diagnoses.\n"
            + "- Never say you diagnosed the patient. Never prescribe or change a dose.\n"
            + "- Ask a clarifying question when the request is ambiguous.\n"
            + "- Always encourage seeing a qualified doctor for anything persistent or serious.\n"
            + "- For emergency symptoms (chest pain, breathing difficulty, stroke signs, heavy bleeding,\n"
            + "  fainting, seizure, suicidal thoughts) tell the patient to seek emergency care immediately\n"
            + "  and do not attempt diagnosis or treatment.\n"
            + "- Keep answers concise and structured with short bullet points.";

    private static final String SYSTEM_PROMPT_BN =
            "তুমি MediTalk AI স্বাস্থ্য সহকারী। তুমি কোনো ডাক্তার নও, শুধু তথ্য সহায়ক।\n"
            + "নির্দেশনা:\n"
            + "- সহজ বাংলায় সহানুভূতিশীল ও নির্ভুল সাধারণ স্বাস্থ্য তথ্য দাও।\n"
            + "- জটিল চিকিৎসা পরিভাষা সহজ ভাষায় বুঝিয়ে দাও এবং নিজের ওষুধ বুঝতে সাহায্য করো।\n"
            + "- রোগীর নিজের ওষুধ নিয়ে প্রশ্ন করলে শুধুমাত্র নিচে দেওয়া নিশ্চিত ওষুধের তালিকা ব্যবহার করো।\n"
            + "- রোগীর কোনো তথ্য, পরীক্ষার ফল, ডোজ বা রোগ নির্ণয় নিজে থেকে বানিয়ে বলবে না।\n"
            + "- কখনো বলবে না যে তুমি রোগ নির্ণয় করেছ। ডোজ বাড়ানো-কমানোর পরামর্শ দেবে না।\n"
            + "- প্রশ্ন অস্পষ্ট হলে একটি স্পষ্ট প্রশ্ন করো।\n"
            + "- দীর্ঘস্থায়ী বা গুরুতর সমস্যায় অবশ্যই যোগ্য ডাক্তার দেখানোর পরামর্শ দাও।\n"
            + "- জরুরি লক্ষণে (বুকে ব্যথা, শ্বাসকষ্ট, স্ট্রোকের লক্ষণ, অতিরিক্ত রক্তপাত, বেহোশ,\n"
            + "  খিঁচুনি, আত্মহত্যার চিন্তা) সঙ্গে সঙ্গে জরুরি চিকিৎসা নিতে বলো।\n"
            + "- উত্তর সংক্ষিপ্ত ও পয়েন্ট আকারে দাও।";

    /** Last provider failure, kept for the diagnostics endpoint (never contains a key). */
    private volatile String lastFailure;

    /** Chat response plus the origin of the text. */
    public static class ChatResult {
        private final String text;
        private final String source;
        private final String errorMessage;

        ChatResult(String text, String source, String errorMessage) {
            this.text = text;
            this.source = source;
            this.errorMessage = errorMessage;
        }

        public static ChatResult gemini(String text) { return new ChatResult(text, "gemini", null); }

        public static ChatResult unavailable(String errorMessage) { return new ChatResult(null, "unavailable", errorMessage); }

        public String getText() { return text; }
        public String getSource() { return source; }
        public String getErrorMessage() { return errorMessage; }
    }

    public boolean isConfigured() {
        return resolveApiKey() != null;
    }

    public ChatResult chat(String userMessage, String language, String medicationContext) {
        String apiKey = resolveApiKey();
        if (apiKey == null) {
            return ChatResult.unavailable("Health AI is not configured on the server (missing HEALTH_CHAT_GEMINI_API_KEY).");
        }
        if (userMessage == null || userMessage.isBlank()) {
            return ChatResult.unavailable("A message is required.");
        }

        String systemPrompt = "bn".equalsIgnoreCase(language) ? SYSTEM_PROMPT_BN : SYSTEM_PROMPT_EN;
        String prompt = buildPrompt(systemPrompt, medicationContext, userMessage);

        String lastError = null;
        // An access-level failure (bad/denied key, quota) explains the outage better than
        // a "model not found" from a fallback model, so it wins when reporting.
        String preferredError = null;
        for (String model : resolveModels()) {
            try {
                String result = callGeminiModel(model, apiKey, prompt);
                if (result != null && !result.isBlank()) {
                    lastFailure = null;
                    log.info("Health AI responded using model {}.", model);
                    return ChatResult.gemini(result);
                }
                lastError = "The health AI returned an empty response.";
            } catch (HttpFailure e) {
                log.warn("Health AI model {} failed: {}", model, e.getMessage());
                lastError = describeFailure(e.status);
                if (e.status == 401 || e.status == 403 || e.status == 429) {
                    preferredError = lastError;
                }
            } catch (java.net.http.HttpTimeoutException e) {
                log.warn("Health AI model {} timed out.", model);
                lastError = "The health AI took too long to respond. Please try again.";
            } catch (Exception e) {
                log.warn("Health AI model {} failed: {} — {}", model, e.getClass().getSimpleName(), e.getMessage());
                lastError = "The health AI is temporarily unavailable. Please try again.";
            }
        }

        String reported = preferredError != null ? preferredError : lastError;
        lastFailure = reported != null ? reported : "The health AI is temporarily unavailable.";
        return ChatResult.unavailable(lastFailure);
    }

    /**
     * Non-sensitive diagnostics for operators: whether a credential is present, which
     * models are configured and why the last request failed. Never returns the key.
     */
    public Map<String, Object> status() {
        return Map.of(
                "provider", "gemini",
                "configured", isConfigured(),
                "models", resolveModels(),
                "lastFailure", lastFailure != null ? lastFailure : ""
        );
    }

    public ChatResult chat(String userMessage, String language) {
        return chat(userMessage, language, null);
    }

    private String buildPrompt(String systemPrompt, String medicationContext, String userMessage) {
        StringBuilder sb = new StringBuilder(systemPrompt);
        if (medicationContext != null && !medicationContext.isBlank()) {
            sb.append("\n\nThe patient's own confirmed medication list (from their MediTalk records):\n")
                    .append(medicationContext)
                    .append("\nUse it only to answer questions about their medicines. Do not change or add to it.");
        }
        sb.append("\n\nPatient message: \"").append(userMessage).append("\"");
        return sb.toString();
    }

    private String callGeminiModel(String model, String apiKey, String prompt) throws Exception {
        Map<String, Object> payload = Map.of(
                "contents", List.of(
                        Map.of("role", "user",
                                "parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", temperature,
                        "maxOutputTokens", maxOutputTokens,
                        "topP", 0.8
                )
        );

        String jsonBody = objectMapper.writeValueAsString(payload);
        String url = GEMINI_BASE_URL + model + ":generateContent";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new HttpFailure(response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode candidateText = root
                .path("candidates").path(0)
                .path("content").path("parts").path(0)
                .path("text");

        if (!candidateText.isMissingNode() && !candidateText.asText().isBlank()) {
            return candidateText.asText();
        }
        return null;
    }

    private String resolveApiKey() {
        if (healthChatApiKey != null && !healthChatApiKey.isBlank() && !healthChatApiKey.startsWith("${")) {
            return healthChatApiKey.trim();
        }
        if (sharedApiKey != null && !sharedApiKey.isBlank() && !sharedApiKey.startsWith("${")) {
            return sharedApiKey.trim();
        }
        return null;
    }

    private List<String> resolveModels() {
        List<String> models = new ArrayList<>();
        if (healthChatModel != null && !healthChatModel.isBlank()) {
            models.add(healthChatModel.trim());
        }
        if (primaryModel != null && !primaryModel.isBlank()) {
            models.add(primaryModel.trim());
        }
        if (fallbackModelsRaw != null && !fallbackModelsRaw.isBlank()) {
            Arrays.stream(fallbackModelsRaw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .forEach(models::add);
        }
        List<String> unique = new ArrayList<>();
        for (String model : models) {
            if (!unique.contains(model)) {
                unique.add(model);
            }
        }
        if (unique.isEmpty()) {
            unique.add("gemini-3.8-flash");
        }
        return unique;
    }

    private String describeFailure(int status) {
        if (status == 401) {
            return "The health AI provider rejected the configured API key. Please check HEALTH_CHAT_GEMINI_API_KEY.";
        }
        if (status == 403) {
            return "The health AI provider denied this API key's Google Cloud project (PERMISSION_DENIED). "
                    + "Enable the Generative Language API for that project or create a new key in Google AI Studio.";
        }
        if (status == 404) {
            return "The configured health AI model is unavailable. Please contact support.";
        }
        if (status == 429) {
            return "The health AI is busy right now. Please try again in a moment.";
        }
        if (status >= 500) {
            return "The health AI is temporarily unavailable. Please try again.";
        }
        return "The health AI is temporarily unavailable.";
    }

    private static class HttpFailure extends Exception {
        private final int status;

        HttpFailure(int status) {
            super("HTTP " + status);
            this.status = status;
        }
    }
}
