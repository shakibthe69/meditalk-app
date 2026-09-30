package com.meditalk.controllers;

import com.meditalk.dto.AdminChatDtos;
import com.meditalk.dto.ApiResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.AdminChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Patient ↔ admin support conversation.
 *
 * <p>The {@code /api/admin-messages/**} routes are available to any authenticated
 * user (the patient side), while {@code /api/admin/conversations/**} is guarded by
 * {@code hasRole('ADMIN')} exactly like the rest of the admin panel.</p>
 */
@RestController
public class AdminChatController {

    private final AdminChatService chatService;

    public AdminChatController(AdminChatService chatService) {
        this.chatService = chatService;
    }

    // ---------- Patient side ----------

    @GetMapping("/api/admin-messages/thread")
    public ResponseEntity<ApiResponse<List<AdminChatDtos.ChatMessage>>> myThread(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(chatService.patientThread(principal.getId())));
    }

    @PostMapping("/api/admin-messages")
    public ResponseEntity<ApiResponse<AdminChatDtos.ChatMessage>> sendToAdmin(
            @RequestBody AdminChatDtos.SendRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.sendFromPatient(principal.getId(), request.getMessage()),
                "Message sent to Meditalk support"));
    }

    // ---------- Admin side ----------

    @GetMapping("/api/admin/conversations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminChatDtos.Conversation>>> conversations() {
        return ResponseEntity.ok(ApiResponse.success(chatService.conversations()));
    }

    @GetMapping("/api/admin/conversations/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminChatDtos.ChatMessage>>> adminThread(
            @PathVariable Long patientId) {
        chatService.markThreadRead(patientId);
        return ResponseEntity.ok(ApiResponse.success(chatService.adminThread(patientId)));
    }

    @PostMapping("/api/admin/conversations/{patientId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminChatDtos.ChatMessage>> reply(
            @PathVariable Long patientId,
            @RequestBody AdminChatDtos.SendRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.sendFromAdmin(principal.getId(), patientId, request.getMessage()),
                "Reply sent"));
    }
}
