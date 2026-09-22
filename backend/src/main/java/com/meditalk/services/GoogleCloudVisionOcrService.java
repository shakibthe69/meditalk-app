package com.meditalk.services;

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
import java.util.ArrayList;
import java.util.List;

@Service
public class GoogleCloudVisionOcrService {

    private static final Logger log = LoggerFactory.getLogger(GoogleCloudVisionOcrService.class);

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
            log.info("Google Cloud Vision OCR is disabled via configuration.");
            return OcrTextResult.failure("Google Cloud Vision OCR is disabled in application configuration.");
        }

        ImageAnnotatorClient client = null;
        try {
            ImageAnnotatorSettings.Builder settingsBuilder = ImageAnnotatorSettings.newBuilder();

            if (credentialsPath != null && !credentialsPath.isBlank()) {
                File credFile = new File(credentialsPath);
                if (credFile.exists()) {
                    try (InputStream is = new FileInputStream(credFile)) {
                        GoogleCredentials credentials = GoogleCredentials.fromStream(is);
                        settingsBuilder.setCredentialsProvider(FixedCredentialsProvider.create(credentials));
                    }
                }
            }

            // Attempt to build client. If no default application credentials or specific credentials, it may throw.
            try {
                client = ImageAnnotatorClient.create(settingsBuilder.build());
            } catch (Exception ex) {
                log.warn("Google Cloud Vision client could not find active GCP credentials in environment ({}: {}).",
                        ex.getClass().getSimpleName(), ex.getMessage());
                return OcrTextResult.failure("Google Cloud Vision API requires GCP credentials in backend configuration: " + ex.getMessage());
            }

            ByteString imgBytes = ByteString.copyFrom(imageBytes);
            Image image = Image.newBuilder().setContent(imgBytes).build();

            // Set DOCUMENT_TEXT_DETECTION with language hints for English and Bengali
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
                return OcrTextResult.failure("No response from Google Cloud Vision OCR");
            }

            AnnotateImageResponse res = responses.get(0);
            if (res.hasError()) {
                log.warn("Google Cloud Vision returned error: {}", res.getError().getMessage());
                return OcrTextResult.failure("Google Cloud Vision returned error: " + res.getError().getMessage());
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

                double confidence = (pageCount > 0 && totalConfidence > 0) ? (totalConfidence / pageCount) : 0.92;
                log.info("Google Cloud Vision extracted {} characters, languages: {}, confidence: {}",
                        fullText.length(), languages, confidence);

                return OcrTextResult.success(fullText, languages, confidence);
            }

            // Fallback if text annotation was empty
            if (!res.getTextAnnotationsList().isEmpty()) {
                String text = res.getTextAnnotations(0).getDescription();
                return OcrTextResult.success(text, List.of("en"), 0.85);
            }

            return OcrTextResult.failure("No text could be recognized in the prescription image.");

        } catch (Exception e) {
            log.warn("Exception during Google Cloud Vision OCR execution: {}", e.getMessage());
            return OcrTextResult.failure("OCR service error: " + e.getMessage());
        } finally {
            if (client != null) {
                try {
                    client.close();
                } catch (Exception ignored) {}
            }
        }
    }
}
