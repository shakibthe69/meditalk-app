package com.meditalk.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.*;
import com.google.protobuf.ByteString;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GoogleCloudVisionOcrService {

    private static final Logger log = LoggerFactory.getLogger(GoogleCloudVisionOcrService.class);
    private static final String VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${app.ocr.google-cloud.enabled:true}")
    private boolean enabled;

    @Value("${app.ocr.google-cloud.credentials-path:}")
    private String credentialsPath;

    @Value("${app.ocr.google-cloud.api-key:}")
    private String apiKey;

    public static class OcrTextResult {
        private final String fullText;
        private final List<String> detectedLanguages;
        private final double confidenceScore;
        private final boolean isSuccess;
        private final String errorMessage;

        public OcrTextResult(String fullText, List<String> detectedLanguages, double confidenceScore, boolean isSuccess, String errorMessage) {
            this.fullText = fullText;
            this.detectedLanguages = detectedLanguages != null ? detectedLanguages : new ArrayList<>();
            this.confidenceScore = confidenceScore;
            this.isSuccess = isSuccess;
            this.errorMessage = errorMessage;
        }

        public static OcrTextResult success(String fullText, List<String> languages, double confidence) {
            return new OcrTextResult(fullText, languages, confidence, true, null);
        }

        public static OcrTextResult failure(String errorMessage) {
            return new OcrTextResult("", new ArrayList<>(), 0.0, false, errorMessage);
        }

        public String getFullText() { return fullText; }
        public List<String> getDetectedLanguages() { return detectedLanguages; }
        public double getConfidenceScore() { return confidenceScore; }
        public boolean isSuccess() { return isSuccess; }
        public String getErrorMessage() { return errorMessage; }
    }

    public OcrTextResult detectText(byte[] imageBytes) {
        if (!enabled) {
            log.warn("Google Cloud Vision OCR is disabled via configuration.");
            return OcrTextResult.failure("Google Cloud Vision OCR is disabled on the server.");
        }

        if (imageBytes == null || imageBytes.length == 0) {
            log.warn("Empty image bytes provided to OCR service.");
            return OcrTextResult.failure("Image payload was empty.");
        }

        // 1. Try Google Cloud Vision Client SDK with Service Account Credentials (Application Default Credentials)
        try {
            log.info("Executing Google Cloud Vision OCR with DOCUMENT_TEXT_DETECTION...");
            OcrTextResult sdkResult = callVisionSdk(imageBytes);
            if (sdkResult.isSuccess() && !sdkResult.getFullText().isBlank()) {
                return sdkResult;
            }
        } catch (Exception ex) {
            log.warn("Google Cloud Vision SDK client failed ({}: {}).", ex.getClass().getSimpleName(), ex.getMessage());
        }

        // 2. Try Google Cloud Vision REST API if API Key is available
        String resolvedApiKey = getEffectiveApiKey();
        if (resolvedApiKey != null && !resolvedApiKey.isBlank()) {
            try {
                log.info("Attempting Google Cloud Vision OCR via REST API Key...");
                OcrTextResult restResult = callVisionRestApi(imageBytes, resolvedApiKey);
                if (restResult.isSuccess() && !restResult.getFullText().isBlank()) {
                    return restResult;
                }
            } catch (Exception ex) {
                log.warn("Google Cloud Vision REST API failed ({}: {}).", ex.getClass().getSimpleName(), ex.getMessage());
            }
        }

        // Every real OCR provider failed. Never fabricate prescription text —
        // return a clear failure so the client can ask the user to retry with a
        // clearer image or enter the text manually (medical-safety requirement).
        log.warn("All Google Cloud Vision OCR attempts failed; returning an error result.");
        return OcrTextResult.failure(
                "Could not read text from the image. Verify the server's Google Cloud Vision credentials and try again with a clearer photo."
        );
    }

    private String getEffectiveCredentialsPath() {
        if (credentialsPath != null && !credentialsPath.isBlank() && !credentialsPath.startsWith("${")) {
            return credentialsPath;
        }
        String envPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
        if (envPath != null && !envPath.isBlank()) {
            return envPath;
        }
        String sysProp = System.getProperty("google.application.credentials");
        if (sysProp != null && !sysProp.isBlank()) {
            return sysProp;
        }
        return null;
    }

    private String getEffectiveApiKey() {
        if (apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("${")) {
            return apiKey;
        }
        String envKey = System.getenv("GOOGLE_CLOUD_API_KEY");
        if (envKey != null && !envKey.isBlank()) {
            return envKey;
        }
        String sysProp = System.getProperty("google.cloud.api-key");
        if (sysProp != null && !sysProp.isBlank()) {
            return sysProp;
        }
        return null;
    }

    private OcrTextResult callVisionSdk(byte[] imageBytes) {
        ImageAnnotatorClient client = null;
        try {
            ImageAnnotatorSettings.Builder settingsBuilder = ImageAnnotatorSettings.newBuilder();

            String resolvedCredPath = getEffectiveCredentialsPath();
            if (resolvedCredPath != null && !resolvedCredPath.isBlank()) {
                File credFile = new File(resolvedCredPath);
                if (credFile.exists()) {
                    try (InputStream is = new FileInputStream(credFile)) {
                        GoogleCredentials credentials = GoogleCredentials.fromStream(is)
                                .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
                        settingsBuilder.setCredentialsProvider(FixedCredentialsProvider.create(credentials));
                        log.info("Loaded Google Cloud service account credentials from: {}", credFile.getName());
                    }
                }
            }

            client = ImageAnnotatorClient.create(settingsBuilder.build());

            ByteString imgBytes = ByteString.copyFrom(imageBytes);
            Image image = Image.newBuilder().setContent(imgBytes).build();

            Feature feature = Feature.newBuilder()
                    .setType(Feature.Type.DOCUMENT_TEXT_DETECTION)
                    .build();

            ImageContext imageContext = ImageContext.newBuilder()
                    .addAllLanguageHints(List.of("en", "bn"))
                    .build();

            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .addFeatures(feature)
                    .setImage(image)
                    .setImageContext(imageContext)
                    .build();

            BatchAnnotateImagesResponse response = client.batchAnnotateImages(List.of(request));
            List<AnnotateImageResponse> responses = response.getResponsesList();

            if (responses.isEmpty()) {
                return OcrTextResult.failure("No response from Google Cloud Vision SDK");
            }

            AnnotateImageResponse res = responses.get(0);
            if (res.hasError()) {
                log.warn("Google Cloud Vision SDK error: {}", res.getError().getMessage());
                return OcrTextResult.failure(res.getError().getMessage());
            }

            TextAnnotation fullTextAnnotation = res.getFullTextAnnotation();
            if (fullTextAnnotation != null && !fullTextAnnotation.getText().isBlank()) {
                String fullText = fullTextAnnotation.getText();
                List<String> languages = new ArrayList<>();
                double totalConfidence = 0.0;
                int pageCount = 0;

                for (Page page : fullTextAnnotation.getPagesList()) {
                    totalConfidence += page.getConfidence();
                    pageCount++;
                    if (page.hasProperty() && page.getProperty().getDetectedLanguagesCount() > 0) {
                        for (TextAnnotation.DetectedLanguage lang : page.getProperty().getDetectedLanguagesList()) {
                            if (!languages.contains(lang.getLanguageCode())) {
                                languages.add(lang.getLanguageCode());
                            }
                        }
                    }
                }

                double confidence = (pageCount > 0 && totalConfidence > 0) ? (totalConfidence / pageCount) : 0.94;
                log.info("Google Cloud Vision SDK extracted {} characters, languages: {}, confidence: {}",
                        fullText.length(), languages, confidence);

                return OcrTextResult.success(fullText, languages.isEmpty() ? List.of("en", "bn") : languages, confidence);
            }

            if (!res.getTextAnnotationsList().isEmpty()) {
                String text = res.getTextAnnotations(0).getDescription();
                return OcrTextResult.success(text, List.of("en", "bn"), 0.88);
            }

            return OcrTextResult.failure("No text found in image via Google Cloud Vision SDK.");

        } catch (Exception e) {
            log.warn("Google Cloud Vision SDK execution exception: {}", e.getMessage());
            return OcrTextResult.failure("GCP Vision SDK: " + e.getMessage());
        } finally {
            if (client != null) {
                try {
                    client.close();
                } catch (Exception ignored) {}
            }
        }
    }

    private OcrTextResult callVisionRestApi(byte[] imageBytes, String key) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        Map<String, Object> requestPayload = Map.of(
                "requests", List.of(
                        Map.of(
                                "image", Map.of("content", base64Image),
                                "features", List.of(
                                        Map.of("type", "DOCUMENT_TEXT_DETECTION"),
                                        Map.of("type", "TEXT_DETECTION")
                                ),
                                "imageContext", Map.of(
                                        "languageHints", List.of("en", "bn")
                                )
                        )
                )
        );

        String jsonBody = objectMapper.writeValueAsString(requestPayload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(VISION_API_URL + "?key=" + key))
                .header("Content-Type", "application/json; charset=UTF-8")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .timeout(Duration.ofSeconds(20))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("Google Cloud Vision REST API returned HTTP {}: {}", response.statusCode(), response.body());
            return OcrTextResult.failure("Google Cloud Vision API HTTP error: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode responses = root.path("responses");
        if (responses.isArray() && responses.size() > 0) {
            JsonNode firstRes = responses.get(0);

            if (firstRes.has("error")) {
                String errorMsg = firstRes.path("error").path("message").asText("Unknown GCP error");
                log.warn("Vision API response contained error: {}", errorMsg);
                return OcrTextResult.failure(errorMsg);
            }

            JsonNode fullTextNode = firstRes.path("fullTextAnnotation");
            if (!fullTextNode.isMissingNode() && fullTextNode.has("text")) {
                String fullText = fullTextNode.path("text").asText();
                List<String> languages = new ArrayList<>();
                JsonNode pages = fullTextNode.path("pages");
                double totalConfidence = 0.0;
                int pageCount = 0;

                if (pages.isArray()) {
                    for (JsonNode page : pages) {
                        pageCount++;
                        if (page.has("confidence")) {
                            totalConfidence += page.path("confidence").asDouble();
                        }
                        JsonNode detectedLangs = page.path("property").path("detectedLanguages");
                        if (detectedLangs.isArray()) {
                            for (JsonNode lang : detectedLangs) {
                                String code = lang.path("languageCode").asText();
                                if (!languages.contains(code)) {
                                    languages.add(code);
                                }
                            }
                        }
                    }
                }

                double confidence = (pageCount > 0 && totalConfidence > 0) ? (totalConfidence / pageCount) : 0.94;
                log.info("Successfully extracted {} chars from Vision REST API with confidence {}", fullText.length(), confidence);
                return OcrTextResult.success(fullText, languages.isEmpty() ? List.of("en", "bn") : languages, confidence);
            }

            JsonNode textAnnotations = firstRes.path("textAnnotations");
            if (textAnnotations.isArray() && textAnnotations.size() > 0) {
                String text = textAnnotations.get(0).path("description").asText();
                return OcrTextResult.success(text, List.of("en", "bn"), 0.88);
            }
        }

        return OcrTextResult.failure("No text found in Vision REST API response.");
    }

}
