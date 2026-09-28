package com.meditalk.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditalk.exceptions.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.MemoryCacheImageOutputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Prescription OCR via the OCR.space API.
 *
 * <p>Runs entirely on the backend: the OCR.space API key is only read from server
 * configuration and is never returned to, or requested from, the mobile client.</p>
 *
 * <p>This service only performs OCR. Turning the returned raw text into structured
 * prescription data is the job of {@link GeminiPrescriptionExtractionService}.</p>
 */
@Service
public class PrescriptionOcrService {

    private static final Logger log = LoggerFactory.getLogger(PrescriptionOcrService.class);

    /** Image types we accept for prescription scanning. */
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "application/octet-stream"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @Value("${app.ocr.ocr-space.enabled:true}")
    private boolean enabled;

    @Value("${app.ocr.ocr-space.api-key:}")
    private String apiKey;

    @Value("${app.ocr.ocr-space.endpoint:https://api.ocr.space/parse/image}")
    private String endpoint;

    @Value("${app.ocr.ocr-space.language:eng}")
    private String language;

    @Value("${app.ocr.ocr-space.engine:2}")
    private String ocrEngine;

    @Value("${app.ocr.ocr-space.timeout-seconds:45}")
    private int timeoutSeconds;

    @Value("${app.ocr.ocr-space.max-payload-bytes:1000000}")
    private int maxPayloadBytes;

    @Value("${app.ocr.ocr-space.paid-plan:false}")
    private boolean paidPlan;

    /** Result of a single OCR.space call. */
    public static class OcrSpaceResult {
        private final boolean success;
        private final String fullText;
        private final String errorMessage;

        private OcrSpaceResult(boolean success, String fullText, String errorMessage) {
            this.success = success;
            this.fullText = fullText;
            this.errorMessage = errorMessage;
        }

        public static OcrSpaceResult success(String fullText) {
            return new OcrSpaceResult(true, fullText, null);
        }

        public static OcrSpaceResult failure(String errorMessage) {
            return new OcrSpaceResult(false, null, errorMessage);
        }

        public boolean isSuccess() { return success; }
        public String getFullText() { return fullText; }
        public String getErrorMessage() { return errorMessage; }
    }

    /** True when the OCR.space credential is present and the provider is enabled. */
    public boolean isConfigured() {
        return enabled
                && apiKey != null
                && !apiKey.isBlank()
                && !apiKey.startsWith("${");
    }

    public String getLanguage() {
        return language;
    }

    /**
     * Sends the (already preprocessed) prescription image to OCR.space and returns
     * the raw extracted text.
     *
     * @param imageBytes  image payload
     * @param contentType MIME type of the payload, may be null
     * @param fileName    original file name, may be null
     */
    public OcrSpaceResult extractText(byte[] imageBytes, String contentType, String fileName) {
        if (!isConfigured()) {
            return OcrSpaceResult.failure("OCR.space is not configured on the server.");
        }
        if (imageBytes == null || imageBytes.length == 0) {
            return OcrSpaceResult.failure("The prescription image was empty. Please try again.");
        }
        validateContentType(contentType);

        byte[] payload;
        String uploadName;
        String uploadType;
        try {
            payload = shrinkToFit(imageBytes, contentType);
            uploadType = payload.length == imageBytes.length && contentType != null ? contentType : "image/jpeg";
            uploadName = payload.length == imageBytes.length && fileName != null && !fileName.isBlank()
                    ? fileName
                    : "prescription.jpg";
        } catch (Exception e) {
            log.warn("Could not prepare prescription image for OCR.space: {}", e.getMessage());
            return OcrSpaceResult.failure("Could not prepare the prescription image for scanning. Please try again.");
        }

        String boundary = "----MeditalkOcr" + UUID.randomUUID().toString().replace("-", "");
        byte[] body;
        try {
            body = buildMultipartBody(boundary, payload, uploadName, uploadType);
        } catch (IOException e) {
            return OcrSpaceResult.failure("Could not prepare the OCR request. Please try again.");
        }

        log.info("OCR request started (engine={}, language={}, payload={} bytes)",
                ocrEngine, language, payload.length);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .header("apikey", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 401 || response.statusCode() == 403) {
                log.warn("OCR.space rejected the configured API key (HTTP {}).", response.statusCode());
                return OcrSpaceResult.failure("The OCR service rejected the server credential. Please contact support.");
            }
            if (response.statusCode() == 429) {
                log.warn("OCR.space rate limit reached.");
                return OcrSpaceResult.failure("The OCR service is busy right now. Please try again in a moment.");
            }
            if (response.statusCode() >= 500) {
                log.warn("OCR.space returned HTTP {}.", response.statusCode());
                return OcrSpaceResult.failure("The OCR service is temporarily unavailable. Please try again.");
            }
            if (response.statusCode() != 200) {
                log.warn("OCR.space returned unexpected HTTP {}.", response.statusCode());
                return OcrSpaceResult.failure("Prescription scanning failed. Please try again.");
            }

            return parseResponse(response.body());

        } catch (java.net.http.HttpTimeoutException e) {
            log.warn("OCR.space request timed out after {}s.", timeoutSeconds);
            return OcrSpaceResult.failure("Prescription scanning timed out. Please check your connection and retry.");
        } catch (IOException e) {
            log.warn("OCR.space request failed: {}", e.getMessage());
            return OcrSpaceResult.failure("Could not reach the OCR service. Please check your connection and retry.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return OcrSpaceResult.failure("Prescription scanning was interrupted. Please try again.");
        }
    }

    // Package-private so the response handling can be unit tested without network access.
    OcrSpaceResult parseResponse(String responseBody) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);

            if (root.path("IsErroredOnProcessing").asBoolean(false)) {
                String message = firstText(root.path("ErrorMessage"));
                if (message == null || message.isBlank()) {
                    message = firstText(root.path("ErrorDetails"));
                }
                log.warn("OCR.space reported a processing error: {}", message);
                return OcrSpaceResult.failure(
                        "The prescription image could not be read"
                                + (message != null && !message.isBlank() ? " (" + message + ")." : ".")
                                + " Please try a clearer photo.");
            }

            int exitCode = root.path("OCRExitCode").asInt(1);
            if (exitCode != 1 && exitCode != 2) {
                log.warn("OCR.space exit code {} indicates failure.", exitCode);
                return OcrSpaceResult.failure("The prescription image could not be read. Please try a clearer photo.");
            }

            JsonNode parsedResults = root.path("ParsedResults");
            List<String> chunks = new ArrayList<>();
            if (parsedResults.isArray()) {
                for (JsonNode result : parsedResults) {
                    String text = result.path("ParsedText").asText("");
                    if (!text.isBlank()) {
                        chunks.add(text.trim());
                    }
                }
            }

            String fullText = String.join("\n", chunks).trim();
            if (fullText.isBlank()) {
                log.info("OCR.space succeeded but returned no readable text.");
                return OcrSpaceResult.failure(
                        "We could not read any text from this prescription. Try a brighter, straighter photo of the whole page.");
            }

            log.info("OCR succeeded: extracted {} characters (exitCode={}).", fullText.length(), exitCode);
            return OcrSpaceResult.success(fullText);

        } catch (Exception e) {
            log.warn("Could not parse the OCR.space response: {}", e.getMessage());
            return OcrSpaceResult.failure("The OCR service returned an unexpected response. Please try again.");
        }
    }

    private void validateContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return;
        }
        String normalized = contentType.toLowerCase().split(";")[0].trim();
        boolean allowed = ALLOWED_CONTENT_TYPES.stream().anyMatch(normalized::startsWith);
        if (!allowed) {
            throw new BadRequestException(
                    "Unsupported image format: " + contentType + ". Please upload a JPEG, PNG or WEBP prescription photo.");
        }
    }

    /**
     * OCR.space rejects oversized uploads. Re-encode to JPEG (and downscale when needed)
     * so a large phone photo still gets scanned instead of failing.
     */
    private byte[] shrinkToFit(byte[] imageBytes, String contentType) throws IOException {
        int limit = paidPlan ? Math.max(maxPayloadBytes, 5_000_000) : maxPayloadBytes;
        if (imageBytes.length <= limit) {
            return imageBytes;
        }

        BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (image == null) {
            throw new IOException("Decoded image was empty");
        }

        byte[] current = encodeJpeg(image, 0.75f);
        int scale = 90;
        while (current.length > limit && scale >= 30) {
            int width = Math.max(1, image.getWidth() * scale / 100);
            int height = Math.max(1, image.getHeight() * scale / 100);
            BufferedImage scaled = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = scaled.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(image, 0, 0, width, height, null);
            g.dispose();
            current = encodeJpeg(scaled, 0.7f);
            scale -= 15;
        }
        return current;
    }

    private byte[] encodeJpeg(BufferedImage image, float quality) throws IOException {
        BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        g.drawImage(image, 0, 0, null);
        g.dispose();

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            ByteArrayOutputStream fallback = new ByteArrayOutputStream();
            ImageIO.write(rgb, "jpg", fallback);
            return fallback.toByteArray();
        }
        ImageWriter writer = writers.next();
        ImageWriteParam params = writer.getDefaultWriteParam();
        params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        params.setCompressionQuality(quality);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (MemoryCacheImageOutputStream stream = new MemoryCacheImageOutputStream(out)) {
            writer.setOutput(stream);
            writer.write(null, new IIOImage(rgb, null, null), params);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }

    private byte[] buildMultipartBody(String boundary, byte[] fileBytes, String fileName, String contentType)
            throws IOException {
        StringBuilder head = new StringBuilder();
        head.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"language\"\r\n\r\n")
                .append(language).append("\r\n");
        head.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"OCREngine\"\r\n\r\n")
                .append(ocrEngine).append("\r\n");
        head.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"scale\"\r\n\r\ntrue\r\n");
        head.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"isTable\"\r\n\r\ntrue\r\n");
        head.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"detectOrientation\"\r\n\r\ntrue\r\n");
        head.append("--").append(boundary).append("\r\n")
                .append("Content-Disposition: form-data; name=\"file\"; filename=\"")
                .append(fileName == null ? "prescription.jpg" : fileName.replace("\"", "")).append("\"\r\n")
                .append("Content-Type: ").append(contentType == null ? "image/jpeg" : contentType).append("\r\n\r\n");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(head.toString().getBytes(StandardCharsets.UTF_8));
        out.write(fileBytes);
        out.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }

    private String firstText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isArray()) {
            StringBuilder sb = new StringBuilder();
            for (JsonNode child : node) {
                String value = child.asText("");
                if (!value.isBlank()) {
                    if (sb.length() > 0) sb.append(" ");
                    sb.append(value.trim());
                }
            }
            return sb.length() == 0 ? null : sb.toString();
        }
        String value = node.asText("");
        return value.isBlank() ? null : value.trim();
    }
}
