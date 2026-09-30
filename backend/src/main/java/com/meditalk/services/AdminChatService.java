package com.meditalk.services;

import com.meditalk.dto.AdminChatDtos;
import com.meditalk.dto.ChatEvent;
import com.meditalk.entities.AdminMessage;
import com.meditalk.entities.User;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.AdminMessageRepository;
import com.meditalk.repositories.UserRepository;
import com.meditalk.websocket.RealtimeHub;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Two-way support conversation between a patient and the Meditalk admin panel.
 *
 * <p>Messages are persisted and also pushed over the realtime socket as
 * {@code admin.message} events, so both the admin inbox and the patient's
 * support screen update live. Admins are notified on every app instance they
 * have open.</p>
 */
@Service
public class AdminChatService {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    private final AdminMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final RealtimeHub hub;

    public AdminChatService(AdminMessageRepository messageRepository,
                            UserRepository userRepository,
                            RealtimeHub hub) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.hub = hub;
    }

    // ---------- Patient side ----------

    @Transactional(readOnly = true)
    public List<AdminChatDtos.ChatMessage> patientThread(Long patientUserId) {
        return messageRepository.findByPatientIdOrderByCreatedAtAsc(patientUserId).stream()
                .map(this::map)
                .toList();
    }

    @Transactional
    public AdminChatDtos.ChatMessage sendFromPatient(Long patientUserId, String body) {
        User patient = requireUser(patientUserId);
        AdminMessage saved = messageRepository.save(AdminMessage.builder()
                .patient(patient)
                .fromAdmin(false)
                .body(requireBody(body))
                .build());

        AdminChatDtos.ChatMessage dto = map(saved);
        // Echo to the patient's own devices and every online admin.
        hub.sendToUser(patientUserId, ChatEvent.of("admin.message", dto));
        for (User admin : userRepository.findAllByRole(ROLE_ADMIN)) {
            hub.sendToUser(admin.getId(), ChatEvent.of("admin.message", dto));
        }
        return dto;
    }

    // ---------- Admin side ----------

    @Transactional(readOnly = true)
    public List<AdminChatDtos.ChatMessage> adminThread(Long patientId) {
        return messageRepository.findByPatientIdOrderByCreatedAtAsc(patientId).stream()
                .map(this::map)
                .toList();
    }

    @Transactional
    public AdminChatDtos.ChatMessage sendFromAdmin(Long adminUserId, Long patientId, String body) {
        User admin = requireUser(adminUserId);
        User patient = requireUser(patientId);

        AdminMessage saved = messageRepository.save(AdminMessage.builder()
                .patient(patient)
                .admin(admin)
                .fromAdmin(true)
                .read(true)
                .body(requireBody(body))
                .build());

        AdminChatDtos.ChatMessage dto = map(saved);
        hub.sendToUser(patientId, ChatEvent.of("admin.message", dto));
        hub.sendToUser(adminUserId, ChatEvent.of("admin.message", dto));
        return dto;
    }

    /** Marks every patient message in a thread as seen by the admin. */
    @Transactional
    public void markThreadRead(Long patientId) {
        List<AdminMessage> messages = messageRepository.findByPatientIdOrderByCreatedAtAsc(patientId);
        List<AdminMessage> changed = new ArrayList<>();
        for (AdminMessage message : messages) {
            if (!message.isFromAdmin() && !message.isRead()) {
                message.setRead(true);
                changed.add(message);
            }
        }
        if (!changed.isEmpty()) {
            messageRepository.saveAll(changed);
        }
    }

    @Transactional(readOnly = true)
    public List<AdminChatDtos.Conversation> conversations() {
        List<AdminChatDtos.Conversation> result = new ArrayList<>();
        for (Long patientId : messageRepository.findDistinctPatientIds()) {
            User patient = userRepository.findById(patientId).orElse(null);
            if (patient == null) {
                continue;
            }
            AdminMessage last = messageRepository
                    .findFirstByPatientIdOrderByCreatedAtDesc(patientId)
                    .orElse(null);
            long unread = messageRepository.countByPatientIdAndFromAdminFalseAndIsReadFalse(patientId);

            result.add(new AdminChatDtos.Conversation(
                    patientId,
                    patient.getFullName(),
                    patient.getEmail(),
                    last != null ? last.getBody() : null,
                    last != null && last.isFromAdmin(),
                    last != null ? last.getCreatedAt() : null,
                    unread));
        }
        // Newest activity first; conversations with no timestamp sort last.
        result.sort((a, b) -> {
            if (a.lastAt() == null && b.lastAt() == null) return 0;
            if (a.lastAt() == null) return 1;
            if (b.lastAt() == null) return -1;
            return b.lastAt().compareTo(a.lastAt());
        });
        return result;
    }

    // ---------- Helpers ----------

    private AdminChatDtos.ChatMessage map(AdminMessage m) {
        return new AdminChatDtos.ChatMessage(
                m.getId(),
                m.getPatient() != null ? m.getPatient().getId() : null,
                m.getPatient() != null ? m.getPatient().getFullName() : null,
                m.getAdmin() != null ? m.getAdmin().getId() : null,
                m.getAdmin() != null ? m.getAdmin().getFullName() : null,
                m.isFromAdmin(),
                m.getBody(),
                m.getCreatedAt());
    }

    private String requireBody(String body) {
        if (body == null || body.trim().isEmpty()) {
            throw new BadRequestException("Message cannot be empty.");
        }
        return body.trim();
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}
