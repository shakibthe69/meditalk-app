package com.meditalk.services;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.meditalk.exceptions.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.color.ColorSpace;
import java.awt.geom.AffineTransform;
import java.awt.image.*;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;

@Service
public class ImagePreprocessingService {

    private static final Logger log = LoggerFactory.getLogger(ImagePreprocessingService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/bmp", "image/jpg", "application/octet-stream"
    );

    @Value("${app.ocr.preprocessing.max-dimension:2048}")
    private int maxDimension;

    @Value("${app.ocr.preprocessing.contrast-enhancement:true}")
    private boolean enableContrastEnhancement;

    @Value("${app.ocr.preprocessing.sharpening:true}")
    private boolean enableSharpening;

    @Value("${app.ocr.preprocessing.grayscale:true}")
    private boolean enableGrayscale;

    public static class PreprocessedImageResult {
        private final byte[] imageBytes;
        private final String mimeType;
        private final int width;
        private final int height;
        private final String summary;

        public PreprocessedImageResult(byte[] imageBytes, String mimeType, int width, int height, String summary) {
            this.imageBytes = imageBytes;
            this.mimeType = mimeType;
            this.width = width;
            this.height = height;
            this.summary = summary;
        }

        public byte[] getImageBytes() { return imageBytes; }
        public String getMimeType() { return mimeType; }
        public int getWidth() { return width; }
        public int getHeight() { return height; }
        public String getSummary() { return summary; }
    }

    public PreprocessedImageResult preprocess(MultipartFile file) {
        validateFile(file);
        try {
            byte[] inputBytes = file.getBytes();
            return preprocessBytes(inputBytes, file.getContentType());
        } catch (IOException e) {
            log.error("Failed to read image bytes: {}", e.getMessage());
            throw new BadRequestException("Failed to read prescription image data.");
        }
    }

    public PreprocessedImageResult preprocessBytes(byte[] inputBytes, String contentType) {
        if (inputBytes == null || inputBytes.length == 0) {
            throw new BadRequestException("Image file cannot be empty.");
        }

        try {
            int orientation = readExifOrientation(inputBytes);

            BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(inputBytes));
            if (originalImage == null) {
                log.info("Image format could not be decoded by ImageIO. Passing original raw bytes directly to Vision OCR.");
                return new PreprocessedImageResult(
                        inputBytes,
                        contentType != null ? contentType : "image/jpeg",
                        0, 0,
                        "Raw image pass-through"
                );
            }

            BufferedImage processed = originalImage;
            StringBuilder summary = new StringBuilder();

            // 1. Orientation Correction
            if (orientation > 1) {
                processed = correctOrientation(processed, orientation);
                summary.append("Orientation corrected (EXIF ").append(orientation).append("); ");
            }

            // 2. Resizing with preserved aspect ratio
            int origW = processed.getWidth();
            int origH = processed.getHeight();
            if (origW > maxDimension || origH > maxDimension) {
                processed = resizeImage(processed, maxDimension);
                summary.append("Resized from ").append(origW).append("x").append(origH)
                        .append(" to ").append(processed.getWidth()).append("x").append(processed.getHeight()).append("; ");
            } else {
                summary.append("Dimensions: ").append(origW).append("x").append(origH).append("; ");
            }

            // 3. Grayscale conversion
            if (enableGrayscale && processed.getType() != BufferedImage.TYPE_BYTE_GRAY) {
                processed = toGrayscale(processed);
                summary.append("Grayscale converted; ");
            }

            // 4. Contrast Enhancement
            if (enableContrastEnhancement) {
                processed = enhanceContrast(processed);
                summary.append("Contrast stretched; ");
            }

            // 5. Sharpening
            if (enableSharpening) {
                processed = sharpenImage(processed);
                summary.append("Sharpened; ");
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(processed, "png", baos);
            byte[] processedBytes = baos.toByteArray();

            log.info("Image preprocessing completed: {}", summary);

            return new PreprocessedImageResult(
                    processedBytes,
                    "image/png",
                    processed.getWidth(),
                    processed.getHeight(),
                    summary.toString()
            );

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Preprocessing encountered error, using original bytes as fallback: {}", e.getMessage());
            return new PreprocessedImageResult(
                    inputBytes,
                    contentType != null ? contentType : "image/jpeg",
                    0, 0,
                    "Raw fallback (preprocessing skipped)"
            );
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select an image file to upload.");
        }
        if (file.getSize() > 20 * 1024 * 1024) { // 20 MB limit
            throw new BadRequestException("Prescription image size exceeds 20MB limit.");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            boolean allowed = ALLOWED_CONTENT_TYPES.stream().anyMatch(t -> contentType.toLowerCase().startsWith(t));
            if (!allowed) {
                throw new BadRequestException("Unsupported image format: " + contentType + ". Allowed: JPEG, PNG, WEBP, BMP.");
            }
        }
    }

    private int readExifOrientation(byte[] bytes) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));
            ExifIFD0Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (directory != null && directory.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                return directory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
            }
        } catch (Exception e) {
            log.debug("EXIF metadata could not be read: {}", e.getMessage());
        }
        return 1;
    }

    private BufferedImage correctOrientation(BufferedImage image, int orientation) {
        int width = image.getWidth();
        int height = image.getHeight();
        AffineTransform transform = new AffineTransform();

        int targetWidth = width;
        int targetHeight = height;

        switch (orientation) {
            case 2: // Flip X
                transform.scale(-1.0, 1.0);
                transform.translate(-width, 0);
                break;
            case 3: // 180 degrees rotation
                transform.translate(width, height);
                transform.rotate(Math.PI);
                break;
            case 4: // Flip Y
                transform.scale(1.0, -1.0);
                transform.translate(0, -height);
                break;
            case 5: // 90 CW + Flip X
                targetWidth = height;
                targetHeight = width;
                transform.rotate(-Math.PI / 2);
                transform.scale(-1.0, 1.0);
                break;
            case 6: // 90 CW
                targetWidth = height;
                targetHeight = width;
                transform.translate(height, 0);
                transform.rotate(Math.PI / 2);
                break;
            case 7: // 270 CW + Flip X
                targetWidth = height;
                targetHeight = width;
                transform.rotate(Math.PI / 2);
                transform.scale(-1.0, 1.0);
                break;
            case 8: // 270 CW (90 CCW)
                targetWidth = height;
                targetHeight = width;
                transform.translate(0, width);
                transform.rotate(-Math.PI / 2);
                break;
            default:
                return image;
        }

        // Always render into an RGB buffer: Java2D does not reliably draw into a
        // TYPE_BYTE_GRAY raster, which produced blank/black scans for rotated
        // photos. A white fill also avoids black wedges at the rotated edges.
        BufferedImage result = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = result.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, targetWidth, targetHeight);
        g.drawImage(image, transform, null);
        g.dispose();
        return result;
    }

    private BufferedImage resizeImage(BufferedImage original, int targetMaxDimension) {
        int width = original.getWidth();
        int height = original.getHeight();

        double ratio = (double) width / height;
        int newWidth;
        int newHeight;

        if (width > height) {
            newWidth = targetMaxDimension;
            newHeight = (int) Math.round(targetMaxDimension / ratio);
        } else {
            newHeight = targetMaxDimension;
            newWidth = (int) Math.round(targetMaxDimension * ratio);
        }

        BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, newWidth, newHeight);
        g2d.drawImage(original, 0, 0, newWidth, newHeight, null);
        g2d.dispose();
        return resized;
    }

    /**
     * Converts to true 8-bit grayscale using {@link ColorConvertOp}, which is the
     * only reliable Java2D path — drawing into a TYPE_BYTE_GRAY Graphics2D can
     * silently produce a blank image on some JDKs.
     */
    private BufferedImage toGrayscale(BufferedImage colorImage) {
        BufferedImage source = colorImage;
        if (source.getType() != BufferedImage.TYPE_INT_RGB) {
            BufferedImage rgb = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = rgb.createGraphics();
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, source.getWidth(), source.getHeight());
            g.drawImage(source, 0, 0, null);
            g.dispose();
            source = rgb;
        }

        BufferedImage grayImage = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        ColorConvertOp converter = new ColorConvertOp(ColorSpace.getInstance(ColorSpace.CS_GRAY), null);
        converter.filter(source, grayImage);
        return grayImage;
    }

    private BufferedImage enhanceContrast(BufferedImage image) {
        BufferedImage gray = (image.getType() == BufferedImage.TYPE_BYTE_GRAY) ? image : toGrayscale(image);
        if (!(gray.getRaster().getDataBuffer() instanceof DataBufferByte)) {
            gray = toGrayscale(gray);
        }
        int width = gray.getWidth();
        int height = gray.getHeight();
        byte[] pixels = ((DataBufferByte) gray.getRaster().getDataBuffer()).getData();

        int[] hist = new int[256];
        for (byte b : pixels) {
            int val = b & 0xFF;
            hist[val]++;
        }

        // Find 2nd percentile min and 98th percentile max for robust contrast stretch
        int totalPixels = pixels.length;
        int p2Threshold = (int) (totalPixels * 0.02);
        int p98Threshold = (int) (totalPixels * 0.98);

        int minVal = 0;
        int accumulated = 0;
        for (int i = 0; i < 256; i++) {
            accumulated += hist[i];
            if (accumulated >= p2Threshold) {
                minVal = i;
                break;
            }
        }

        int maxVal = 255;
        accumulated = 0;
        for (int i = 255; i >= 0; i--) {
            accumulated += hist[i];
            if (accumulated >= (totalPixels - p98Threshold)) {
                maxVal = i;
                break;
            }
        }

        if (maxVal <= minVal) {
            return gray;
        }

        BufferedImage enhanced = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_GRAY);
        byte[] outPixels = ((DataBufferByte) enhanced.getRaster().getDataBuffer()).getData();

        double scale = 255.0 / (maxVal - minVal);
        for (int i = 0; i < pixels.length; i++) {
            int val = pixels[i] & 0xFF;
            int newVal;
            if (val <= minVal) {
                newVal = 0;
            } else if (val >= maxVal) {
                newVal = 255;
            } else {
                newVal = (int) Math.round((val - minVal) * scale);
            }
            outPixels[i] = (byte) newVal;
        }

        return enhanced;
    }

    private BufferedImage sharpenImage(BufferedImage image) {
        float[] sharpenMatrix = {
                0.0f, -1.0f, 0.0f,
                -1.0f, 5.0f, -1.0f,
                0.0f, -1.0f, 0.0f
        };
        Kernel kernel = new Kernel(3, 3, sharpenMatrix);
        ConvolveOp convolveOp = new ConvolveOp(kernel, ConvolveOp.EDGE_NO_OP, null);
        return convolveOp.filter(image, null);
    }
}
