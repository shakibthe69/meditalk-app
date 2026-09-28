package com.meditalk.services;

import com.meditalk.dto.ChatEvent;
import com.meditalk.dto.DoctorMessageResponse;
import com.meditalk.entities.DoctorAccount;
import com.meditalk.entities.DoctorMessage;
import com.meditalk.entities.User;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.DoctorAccountRepository;
import com.meditalk.repositories.DoctorMessageRepository;
import com.meditalk.repositories.UserRepository;
import com.meditalk.websocket.RealtimeHub;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Real-time half of the doctor↔patient conversation. Messages are persisted to
 * the same table as the REST endpoints, then pushed to both parties so the
 * sender's own devices stay in sync with what the server accepted.
 */
@Service
public class ChatRealtimeService {

    private final DoctorMessageRepository doctorMessageRepository;
    private final UserRepository userRepository;
    private final DoctorAccountRepository doctorAccountRepository;
    private final RealtimeHub hub;

    public ChatRealtimeService(DoctorMessageRepository doctorMessageRepository,
                               UserRepository userRepository,
                               DoctorAccountRepository doctorAccountRepository,
                               RealtimeHub hub) {
        this.doctorMessageRepository = doctorMessageRepository;
        this.userRepository = userRepository;
        this.doctorAccountRepository = doctorAccountRepository;
        this.hub = hub;
    }

    /**
     * Persist a message between the two users and deliver it to both sides.
     * The direction is derived from roles, so it works whether the doctor or the
     * patient is the author.
     */
    @Transactional
    public DoctorMessageResponse sendMessage(Long fromUserId, Long toUserId, String body) {
        if (toUserId == null) {
            throw new BadRequestException("toUserId is required.");
        }
        if (body == null || body.trim().isEmpty()) {
            throw new BadRequestException("Message body cannot be empty.");
        }

        User from = requireUser(fromUserId);
        User to = requireUser(toUserId);
        boolean fromDoctor = isDoctor(from);

        if (fromDoctor == isDoctor(to)) {
            throw new BadRequestException("Messages must be between a doctor and a patient.");
        }

        DoctorAccount doctorAccount = fromDoctor
                ? doctorAccountRepository.findByUserId(from.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor account not found"))
                : doctorAccountRepository.findByUserId(to.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Doctor account not found"));

        User patient = fromDoctor ? to : from;

        DoctorMessage saved = doctorMessageRepository.save(DoctorMessage.builder()
                .doctorAccount(doctorAccount)
                .patient(patient)
                .body(body.trim())
                .fromDoctor(fromDoctor)
                .build());

        // Map inside the transaction — the socket thread has no Hibernate session.
        DoctorMessageResponse response = DoctorPortalService.mapToMessageResponse(saved);

        hub.sendToUser(toUserId, ChatEvent.of("message", response));
        hub.sendToUser(fromUserId, ChatEvent.of("message", response));
        return response;
    }

    /** Ephemeral typing indicator — never stored. */
    public void relayTyping(Long fromUserId, Long toUserId, Boolean isTyping) {
        if (toUserId == null) {
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("fromUserId", fromUserId);
        payload.put("isTyping", Boolean.TRUE.equals(isTyping));
        hub.sendToUser(toUserId, ChatEvent.of("typing", payload));
    }

    /** Tell the user who is currently online so their chat list can show live dots. */
    public void sendPresenceSnapshot(Long userId) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("onlineUserIds", hub.onlineUserIds());
        hub.sendToUser(userId, ChatEvent.of("presence.snapshot", payload));
    }

    private boolean isDoctor(User user) {
        return "ROLE_DOCTOR".equals(user.getRole());
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }
}
