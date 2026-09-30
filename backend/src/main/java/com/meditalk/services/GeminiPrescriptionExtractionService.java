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
 * Turns the raw OCR text of a prescription into structured data using Gemini.
 *
 * <p>This service uses its own credential ({@code PRESCRIPTION_GEMINI_API_KEY}),
 * which is intentionally separate from the health-chat credential. The key is only
 * read from server-side configuration.</p>
 *
 * <p>The model is instructed to return strict JSON and to never invent missing
 * information. Everything it returns is validated by
 * {@link PrescriptionExtractionValidator} before it reaches the database — nothing
 * is saved from this service directly.</p>
 */
@Service
public class GeminiPrescriptionExtractionService {

    private static final Logger log = LoggerFactory.getLogger(GeminiPrescriptionExtractionService.class);
    private static final String GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    /** Host for Vertex AI / "Agent Platform" Express keys ("AQ.…"). */
    private static final String VERTEX_EXPRESS_BASE_URL =
            "https://aiplatform.googleapis.com/v1/publishers/google/models/";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${app.gemini.prescription-api-key:}")
    private String prescriptionApiKey;

    @Value("${app.gemini.api-key:}")
    private String sharedApiKey;

    @Value("${app.gemini.model:gemini-3.8-flash}")
    private String primaryModel;

    @Value("${app.gemini.fallback-models:}")
    private String fallbackModelsRaw;

    @Value("${app.gemini.timeout-seconds:60}")
    private int timeoutSeconds;

    @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta/models/}")
    private String baseUrl;

    /** True when the key is a Vertex AI / Agent Platform Express key (AQ.…). */
    @Value("${app.gemini.vertex-express:false}")
    private boolean vertexExpress;

    private static final String SYSTEM_PROMPT =
            "You are a prescription OCR structuring engine for a medical record app.\n"
            + "You receive raw text extracted by an OCR engine from a doctor's prescription.\n\n"
            + "RULES — these are strict:\n"
            + "1. Extract ONLY information that is literally present in the OCR text.\n"
            + "2. NEVER invent, guess, complete or 'correct' a medicine name, strength, dosage,\n"
            + "   frequency, schedule, duration, doctor, patient or date.\n"
            + "3. If a value is missing, unclear or unreadable, use null.\n"
            + "4. Do NOT diagnose, do NOT suggest treatment, do NOT add advice.\n"
            + "5. Preserve the medicine name exactly as printed (do not translate or expand it).\n"
            + "6. Schedule flags (morning/afternoon/evening/night) are true only when the\n"
            + "   prescription text states a dose for that slot (for example '1+0+1' means\n"
            + "   morning=true, afternoon=false, evening=false, night=true; 'bd' means twice daily).\n"
            + "7. If the schedule is not stated, set all four flags false and their related fields null.\n"
            + "8. Respond with a SINGLE strict JSON object and nothing else. No markdown, no code\n"
            + "   fences, no explanation before or after.\n\n"
            + "JSON shape:\n"
            + "{\n"
            + "  \"patientName\": string|null,\n"
            + "  \"doctorName\": string|null,\n"
            + "  \"hospitalOrClinic\": string|null,\n"
            + "  \"prescriptionDate\": \"YYYY-MM-DD\"|null,\n"
            + "  \"diagnosis\": string|null,\n"
            + "  \"medicines\": [\n"
            + "    {\n"
            + "      \"medicineName\": string,\n"
            + "      \"genericName\": string|null,\n"
            + "      \"strength\": string|null,\n"
            + "      \"unit\": string|null,\n"
            + "      \"dosage\": string|null,\n"
            + "      \"frequency\": string|null,\n"
            + "      \"morning\": boolean,\n"
            + "      \"afternoon\": boolean,\n"
            + "      \"evening\": boolean,\n"
            + "      \"night\": boolean,\n"
            + "      \"beforeMeal\": boolean|null,\n"
            + "      \"afterMeal\": boolean|null,\n"
            + "      \"duration\": string|null,\n"
            + "      \"form\": \"TABLET\"|\"CAPSULE\"|\"SYRUP\"|\"INJECTION\"|\"DROPS\"|string|null,\n"
            + "      \"instructions\": string|null,\n"
            + "      \"confidence\": number|null\n"
            + "    }\n"
            + "  ],\n"
            + "  \"notes\": string|null\n"
            + "}\n"
            + "Use an empty medicines array when the text contains no medicine lines.";

    /** Outcome of a Gemini extraction attempt. */
    public static class ExtractionResult {
        private final boolean success;
        private final PrescriptionExtractionValidator.ParsedPrescription parsed;
        private final String errorMessage;

        private ExtractionResult(boolean success, PrescriptionExtractionValidator.ParsedPrescription parsed,
                                 String errorMessage) {
            this.success = success;
            this.parsed = parsed;
            this.errorMessage = errorMessage;
        }

        public static ExtractionResult success(PrescriptionExtractionValidator.ParsedPrescription parsed) {
            return new ExtractionResult(true, parsed, null);
        }

        public static ExtractionResult failure(String errorMessage) {
            return new ExtractionResult(false, null, errorMessage);
        }

        public boolean isSuccess() { return success; }
        public PrescriptionExtractionValidator.ParsedPrescription getParsed() { return parsed; }
        public String getErrorMessage() { return errorMessage; }
    }

    /** True when a prescription-extraction credential is available. */
    public boolean isConfigured() {
        return resolveApiKey() != null;
    }

    /**
     * Extracts structured prescription data from raw OCR text.
     * Never throws for upstream failures — returns a failure result instead so the
     * caller can fall back to deterministic parsing.
     */
    public ExtractionResult extract(String rawOcrText) {
        if (rawOcrText == null || rawOcrText.isBlank()) {
            return ExtractionResult.failure("No OCR text was available to analyze.");
        }
        List<Map<String, Object>> parts = List.of(Map.of("text",
                "Raw OCR text from the prescription:\n\"\"\"\n" + rawOcrText + "\n\"\"\""));
        return runExtraction(parts);
    }

    /**
     * Reads a prescription directly from the image (Gemini is multimodal), so
     * scanning works with the single Gemini/Vertex credential and needs no
     * separate OCR provider. The returned data is validated exactly like the
     * text-based path before it can reach the database.
     */
    public ExtractionResult extractFromImage(byte[] imageBytes, String mimeType) {
        if (imageBytes == null || imageBytes.length == 0) {
            return ExtractionResult.failure("The prescription image was empty. Please try again.");
        }
        String type = (mimeType == null || mimeType.isBlank()) ? "image/png" : mimeType;
        String base64 = java.util.Base64.getEncoder().encodeToString(imageBytes);
        List<Map<String, Object>> parts = List.of(
                Map.of("text", "Read this prescription image and return the JSON described by the schema. "
                        + "Transcribe only what is visibly printed; never invent a medicine name, dose or time."),
                Map.of("inline_data", Map.of("mime_type", type, "data", base64))
        );
        return runExtraction(parts);
    }

    /** Shared model loop for both the text and image entry points. */
    private ExtractionResult runExtraction(List<Map<String, Object>> parts) {
        String apiKey = resolveApiKey();
        if (apiKey == null) {
            return ExtractionResult.failure(
                    "Prescription AI analysis is not configured on the server (missing PRESCRIPTION_GEMINI_API_KEY).");
        }

        String previousError = null;
        // An access-level failure explains the outage better than a fallback model's 404.
        String preferredError = null;
        for (String model : resolveModels()) {
            try {
                log.info("Gemini prescription extraction started with model {}.", model);
                String raw = callGemini(model, apiKey, parts);
                if (raw == null || raw.isBlank()) {
                    previousError = "The extraction model returned an empty response.";
                    continue;
                }
                PrescriptionExtractionValidator.ParsedPrescription parsed =
                        PrescriptionExtractionValidator.parse(raw);
                log.info("Gemini prescription extraction succeeded (model={}, medicines={}).",
                        model, parsed.getMedicines().size());
                return ExtractionResult.success(parsed);
            } catch (IllegalArgumentException e) {
                // Invalid/unusable JSON: do not retry with a weaker model and never
                // let this reach the database.
                log.warn("Gemini extraction response failed validation: {}", e.getMessage());
                previousError = "The AI response could not be validated. Please review the raw text and try again.";
            } catch (Exception e) {
                log.warn("Gemini prescription extraction failed with model {}: {} — {}",
                        model, e.getClass().getSimpleName(), e.getMessage());
                previousError = describeFailure(e);
                if (e instanceof GeminiHttpException) {
                    int status = ((GeminiHttpException) e).status;
                    if (status == 401 || status == 403 || status == 429) {
                        preferredError = previousError;
                    }
                }
            }
        }

        String reported = preferredError != null ? preferredError : previousError;
        return ExtractionResult.failure(reported != null
                ? reported
                : "Prescription AI analysis is temporarily unavailable. Please review the extracted text manually.");
    }

    private String callGemini(String model, String apiKey, List<Map<String, Object>> parts) throws Exception {
        Map<String, Object> payload = Map.of(
                "systemInstruction", Map.of(
                        "parts", List.of(Map.of("text", SYSTEM_PROMPT))
                ),
                "contents", List.of(
                        Map.of("role", "user", "parts", parts)
                ),
                "generationConfig", Map.of(
                        "temperature", 0.0,
                        "topP", 0.8,
                        "maxOutputTokens", 4096,
                        "responseMimeType", "application/json"
                )
        );

        String jsonBody = objectMapper.writeValueAsString(payload);

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(timeoutSeconds));

        String url;
        if (vertexExpress) {
            url = VERTEX_EXPRESS_BASE_URL + model + ":generateContent?key=" + apiKey;
        } else {
            String host = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl : GEMINI_BASE_URL;
            url = host + model + ":generateContent";
            requestBuilder.header("x-goog-api-key", apiKey);
        }

        HttpResponse<String> response = httpClient.send(requestBuilder.uri(URI.create(url)).build(),
                HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new GeminiHttpException(response.statusCode(), safeMessage(response.body()));
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode candidate = root.path("candidates").path(0);
        JsonNode responseParts = candidate.path("content").path("parts");
        if (responseParts.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode part : responseParts) {
                String text = part.path("text").asText("");
                if (!text.isBlank()) {
                    sb.append(text);
                }
            }
            if (sb.length() > 0) {
                return sb.toString();
            }
        }

        // Safety filters and token limits surface here.
        String finishReason = candidate.path("finishReason").asText("");
        if (!finishReason.isBlank()) {
            throw new IllegalStateException("Model stopped without content (finishReason=" + finishReason + ").");
        }
        return null;
    }

    private String resolveApiKey() {
        if (prescriptionApiKey != null && !prescriptionApiKey.isBlank() && !prescriptionApiKey.startsWith("${")) {
            return prescriptionApiKey.trim();
        }
        if (sharedApiKey != null && !sharedApiKey.isBlank() && !sharedApiKey.startsWith("${")) {
            return sharedApiKey.trim();
        }
        return null;
    }

    private List<String> resolveModels() {
        List<String> models = new ArrayList<>();
        if (primaryModel != null && !primaryModel.isBlank()) {
            models.add(primaryModel.trim());
        }
        if (fallbackModelsRaw != null && !fallbackModelsRaw.isBlank()) {
            Arrays.stream(fallbackModelsRaw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank() && !models.contains(s))
                    .forEach(models::add);
        }
        if (models.isEmpty()) {
            models.add(vertexExpress ? "gemini-2.5-flash" : "gemini-3.8-flash");
        }
        if (vertexExpress && !models.contains("gemini-2.5-flash")) {
            models.add("gemini-2.5-flash");
        }
        return models;
    }

    private String describeFailure(Exception e) {
        if (e instanceof GeminiHttpException) {
            int status = ((GeminiHttpException) e).status;
            if (status == 401) {
                return "The prescription AI provider rejected the configured API key. "
                        + "Please check PRESCRIPTION_GEMINI_API_KEY.";
            }
            if (status == 403) {
                String detail = ((GeminiHttpException) e).detail;
                String base = vertexExpress
                        ? "The prescription AI provider denied access. Enable the Agent Platform API "
                                + "(aiplatform.googleapis.com) for the key's Google Cloud project."
                        : "The prescription AI provider denied this key's Google Cloud project "
                                + "(PERMISSION_DENIED). Enable the Generative Language API for that project or create a "
                                + "new key in Google AI Studio.";
                return (detail != null && !detail.isBlank()) ? base + " (" + detail + ")" : base;
            }
            if (status == 404) {
                return "The configured prescription AI model is unavailable. Please contact support.";
            }
            if (status == 429) {
                return "The prescription AI service is busy right now. Please try again in a moment.";
            }
            if (status >= 500) {
                return "The prescription AI service is temporarily unavailable. Please try again.";
            }
            return "Prescription AI analysis failed. Please review the extracted text manually.";
        }
        if (e instanceof java.net.http.HttpTimeoutException) {
            return "Prescription AI analysis timed out. Please try again.";
        }
        return "Prescription AI analysis is temporarily unavailable. Please review the extracted text manually.";
    }

    private String safeMessage(String body) {
        if (body == null) {
            return "";
        }
        try {
            JsonNode error = objectMapper.readTree(body).path("error").path("message");
            return error.isMissingNode() ? "" : error.asText("");
        } catch (Exception e) {
            return "";
        }
    }

    private static class GeminiHttpException extends Exception {
        private final int status;
        private final String detail;

        GeminiHttpException(int status, String message) {
            super("HTTP " + status + (message.isBlank() ? "" : " — " + message));
            this.status = status;
            this.detail = message;
        }
    }
}
