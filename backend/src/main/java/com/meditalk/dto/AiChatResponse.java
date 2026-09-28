package com.meditalk.dto;

public class AiChatResponse {
    private String text;
    private String language;
    private String source; // "gemini" or "fallback"

    public AiChatResponse() {}

    public AiChatResponse(String text, String language, String source) {
        this.text = text;
        this.language = language;
        this.source = source;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
