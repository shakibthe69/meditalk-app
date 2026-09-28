package com.meditalk.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PrescriptionOcrServiceTest {

    private PrescriptionOcrService service;

    @BeforeEach
    void setUp() {
        service = new PrescriptionOcrService();
    }

    @Test
    @DisplayName("Successful OCR.space response returns the parsed text")
    void testSuccessResponse() {
        String body = "{\"ParsedResults\":[{\"ParsedText\":\"Tab. Napa 500mg\\n1+0+1\"}]," +
                "\"OCRExitCode\":1,\"IsErroredOnProcessing\":false}";

        PrescriptionOcrService.OcrSpaceResult result = service.parseResponse(body);

        assertTrue(result.isSuccess());
        assertTrue(result.getFullText().contains("Napa 500mg"));
        assertTrue(result.getFullText().contains("1+0+1"));
    }

    @Test
    @DisplayName("Multiple pages are merged into one text block")
    void testMultipleParsedResults() {
        String body = "{\"ParsedResults\":[{\"ParsedText\":\"Page one\"},{\"ParsedText\":\"Page two\"}]," +
                "\"OCRExitCode\":1,\"IsErroredOnProcessing\":false}";

        PrescriptionOcrService.OcrSpaceResult result = service.parseResponse(body);

        assertTrue(result.isSuccess());
        assertEquals("Page one\nPage two", result.getFullText());
    }

    @Test
    @DisplayName("Processing error surfaces a user friendly message")
    void testErroredResponse() {
        String body = "{\"ErrorMessage\":[\"File size exceeds the limit\"]," +
                "\"OCRExitCode\":3,\"IsErroredOnProcessing\":true}";

        PrescriptionOcrService.OcrSpaceResult result = service.parseResponse(body);

        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
        assertTrue(result.getErrorMessage().contains("File size exceeds the limit"));
    }

    @Test
    @DisplayName("Empty OCR text is a failure, never an empty prescription")
    void testEmptyParsedText() {
        String body = "{\"ParsedResults\":[{\"ParsedText\":\"   \"}]," +
                "\"OCRExitCode\":1,\"IsErroredOnProcessing\":false}";

        PrescriptionOcrService.OcrSpaceResult result = service.parseResponse(body);

        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
    }

    @Test
    @DisplayName("Malformed provider response does not throw")
    void testMalformedResponse() {
        PrescriptionOcrService.OcrSpaceResult result = service.parseResponse("<html>gateway error</html>");

        assertFalse(result.isSuccess());
        assertNotNull(result.getErrorMessage());
    }

    @Test
    @DisplayName("Unconfigured service reports a clear failure instead of calling the network")
    void testNotConfigured() {
        assertFalse(service.isConfigured());

        PrescriptionOcrService.OcrSpaceResult result = service.extractText(new byte[]{1, 2, 3}, "image/png", "rx.png");

        assertFalse(result.isSuccess());
        assertTrue(result.getErrorMessage().contains("not configured"));
    }
}
