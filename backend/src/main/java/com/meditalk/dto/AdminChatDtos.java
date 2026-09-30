package com.meditalk.dto;

import java.time.LocalDateTime;

/** DTOs for the patient ↔ admin support conversation. */
public final class AdminChatDtos {

    private AdminChatDtos() {}

    /** One message in a conversation, as shown to either side. */
    public record ChatMessage(
            Long id,
            Long patientId,
            String patientName,
            Long adminId,
            String adminName,
            boolean fromAdmin,
            String body,
            LocalDateTime createdAt) {}

    /** Admin inbox row: the patient, the latest line and the unread count. */
    public record Conversation(
            Long patientId,
            String patientName,
            String patientEmail,
            String lastMessage,
            boolean lastFromAdmin,
            LocalDateTime lastAt,
            long unreadForAdmin) {}

    /** Request body for sending a message from either side. */
    public static class SendRequest {
        private String message;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
