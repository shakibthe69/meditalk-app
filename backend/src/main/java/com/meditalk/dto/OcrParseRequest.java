package com.meditalk.dto;

import jakarta.validation.constraints.NotBlank;

public class OcrParseRequest {
    @NotBlank(message = "Raw OCR text is required")
    private String rawText;
    private String imageUri;

    public OcrParseRequest() {}

    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }

    public String getImageUri() { return imageUri; }
    public void setImageUri(String imageUri) { this.imageUri = imageUri; }
}
