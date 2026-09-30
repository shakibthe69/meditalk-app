package com.meditalk.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AiChatRequest {

    @NotBlank(message = "Message is required")
    @Size(max = 2000, message = "Message must not exceed 2000 characters")
    private String message;

    private String language = "en"; // "en" or "bn"

    /**
     * Recent conversation turns (oldest first) so the AI can hold a continuous
     * dialogue. Optional — the client sends the last few turns it already shows.
     */
    @Valid
    @Size(max = 20, message = "Too many history turns")
    private List<Turn> history;

    public static class Turn {
        /** "user" or "ai". */
        @NotBlank
        private String role;

        @NotBlank
        @Size(max = 2000, message = "History message must not exceed 2000 characters")
        private String text;

        public Turn() {}

        public Turn(String role, String text) {
            this.role = role;
            this.text = text;
        }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
    }

    public AiChatRequest() {}

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public List<Turn> getHistory() { return history; }
    public void setHistory(List<Turn> history) { this.history = history; }
}
