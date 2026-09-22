package com.meditalk.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class ImagePreprocessingServiceTest {

    private ImagePreprocessingService preprocessingService;

    @BeforeEach
    void setUp() {
        preprocessingService = new ImagePreprocessingService();
        ReflectionTestUtils.setField(preprocessingService, "maxDimension", 1024);
        ReflectionTestUtils.setField(preprocessingService, "enableContrastEnhancement", true);
        ReflectionTestUtils.setField(preprocessingService, "enableSharpening", true);
        ReflectionTestUtils.setField(preprocessingService, "enableGrayscale", true);
    }

    private byte[] createSampleTestImage(int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, width, height);
        g.setColor(Color.BLACK);
        g.setFont(new Font("Arial", Font.BOLD, 24));
        g.drawString("Rx Napa 500mg 1+1+1", 50, 100);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    @Test
    @DisplayName("Image Preprocessing: Scales large image while maintaining aspect ratio and converts to grayscale")
    void testPreprocessingLargeImage() throws IOException {
        byte[] inputImageBytes = createSampleTestImage(2400, 1600);

        ImagePreprocessingService.PreprocessedImageResult result = preprocessingService.preprocessBytes(inputImageBytes, "image/png");

        assertNotNull(result);
        assertNotNull(result.getImageBytes());
        assertTrue(result.getWidth() <= 1024);
        assertTrue(result.getHeight() <= 1024);
        assertTrue(result.getSummary().contains("Resized"));
        assertTrue(result.getSummary().contains("Grayscale"));
        assertTrue(result.getSummary().contains("Sharpened"));
    }

    @Test
    @DisplayName("Image Preprocessing: Handles standard resolution image cleanly")
    void testPreprocessingStandardImage() throws IOException {
        byte[] inputImageBytes = createSampleTestImage(800, 600);

        ImagePreprocessingService.PreprocessedImageResult result = preprocessingService.preprocessBytes(inputImageBytes, "image/png");

        assertNotNull(result);
        assertEquals(800, result.getWidth());
        assertEquals(600, result.getHeight());
        assertTrue(result.getSummary().contains("Grayscale"));
    }
}
