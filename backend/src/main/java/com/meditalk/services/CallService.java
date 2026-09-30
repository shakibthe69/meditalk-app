package com.meditalk.services;

import com.meditalk.config.WebRtcProperties;
import com.meditalk.dto.CallSessionResponse;
import com.meditalk.dto.ChatEvent;
import com.meditalk.dto.IceServersResponse;
import com.meditalk.entities.CallSession;
import com.meditalk.entities.DoctorAccount;
import com.meditalk.entities.User;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.CallSessionRepository;
import com.meditalk.repositories.DoctorAccountRepository;
import com.meditalk.repositories.UserRepository;
import com.meditalk.websocket.RealtimeHub;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Audio/video call signalling between a patient and a doctor.
 *
 * <p>The call is negotiated entirely over WebSocket while the media layer is
 * pending: every session is stamped with a {@code roomId} so a media engine can
 * join the same room later without touching this API.
 */
@Service
public class CallService {

    private static final Logger log = LoggerFactory.getLogger(CallService.class);

    public static final String AUDIO = "AUDIO";
    public static final String VIDEO = "VIDEO";

    private final CallSessionRepository callSessionRepository;
    private final UserRepository userRepository;
    private final DoctorAccountRepository doctorAccountRepository;
    private final RealtimeHub hub;
    private final WebRtcProperties webRtcProperties;

    public CallService(CallSessionRepository callSessionRepository,
                       UserRepository userRepository,
                       DoctorAccountRepository doctorAccountRepository,
                       RealtimeHub hub,
                       WebRtcProperties webRtcProperties) {
        this.callSessionRepository = callSessionRepository;
        this.userRepository = userRepository;
        this.doctorAccountRepository = doctorAccountRepository;
        this.hub = hub;
        this.webRtcProperties = webRtcProperties;
    }

    // ---------- Caller actions ----------

    /**
     * Place a call. If the callee has no live socket the call is recorded as
     * MISSED straight away so the caller is not left ringing a dead line.
     */
    @Transactional
    public CallSessionResponse initiate(Long fromUserId, Long toUserId, String callType) {
        if (toUserId == null) {
            throw new BadRequestException("toUserId is required.");
        }
        if (fromUserId.equals(toUserId)) {
            throw new BadRequestException("You cannot call yourself.");
        }

        User from = requireUser(fromUserId);
        User to = requireUser(toUserId);

        // One side is the patient; the other is the professional side — a doctor,
        // or a Meditalk admin reaching out to support the patient.
        User patient;
        DoctorAccount doctorAccount = null;
        Long adminUserId = null;

        if (isPatient(from) && !isPatient(to)) {
            patient = from;
            if (isDoctor(to)) {
                doctorAccount = requireDoctorAccount(to);
            } else {
                adminUserId = to.getId();
            }
        } else if (isPatient(to) && !isPatient(from)) {
            patient = to;
            if (isDoctor(from)) {
                doctorAccount = requireDoctorAccount(from);
            } else {
                adminUserId = from.getId();
            }
        } else {
            throw new BadRequestException("A call needs one patient and one doctor or admin.");
        }

        String type = VIDEO.equalsIgnoreCase(callType) ? VIDEO : AUDIO;

        CallSession session = callSessionRepository.save(CallSession.builder()
                .patient(patient)
                .doctorAccount(doctorAccount)
                .adminUserId(adminUserId)
                .initiatedByUserId(fromUserId)
                .callType(type)
                .status("RINGING")
                .roomId(type.toLowerCase() + "-" + UUID.randomUUID())
                .build());

        boolean delivered = hub.sendToUser(toUserId,
                ChatEvent.of("call.incoming", mapToResponse(session, toUserId)));

        if (!delivered) {
            session.setStatus("MISSED");
            session.setEndedAt(LocalDateTime.now());
            CallSession saved = callSessionRepository.save(session);
            log.info("Call {} from user {} to user {} missed — callee offline",
                    saved.getId(), fromUserId, toUserId);
            hub.sendToUser(fromUserId, ChatEvent.of("call.missed", mapToResponse(saved, fromUserId)));
            return mapToResponse(saved, fromUserId);
        }

        // Confirm to the caller that the other side is ringing.
        hub.sendToUser(fromUserId, ChatEvent.of("call.ringing", mapToResponse(session, fromUserId)));
        return mapToResponse(session, fromUserId);
    }

    /** The callee picks up. */
    @Transactional
    public CallSessionResponse accept(Long callId, Long userId) {
        CallSession session = requireSession(callId);
        if (!"RINGING".equals(session.getStatus())) {
            throw new BadRequestException("This call is no longer ringing.");
        }
        if (userId.equals(session.getInitiatedByUserId())) {
            throw new BadRequestException("Only the recipient can accept a call.");
        }
        session.setStatus("ACCEPTED");
        session.setAcceptedAt(LocalDateTime.now());
        CallSession saved = callSessionRepository.save(session);

        notifyBoth(saved, "call.accepted");
        log.info("Call {} accepted by user {}", callId, userId);
        return mapToResponse(saved, userId);
    }

    /**
     * The callee rejects the call. A {@code reason} of "timeout" records the call
     * as MISSED rather than DECLINED, which is what an unanswered ring is.
     */
    @Transactional
    public CallSessionResponse decline(Long callId, Long userId, String reason) {
        CallSession session = requireSession(callId);
        if (!"RINGING".equals(session.getStatus())) {
            throw new BadRequestException("This call is no longer ringing.");
        }
        boolean timedOut = "timeout".equalsIgnoreCase(reason);
        session.setStatus(timedOut ? "MISSED" : "DECLINED");
        session.setEndedAt(LocalDateTime.now());
        CallSession saved = callSessionRepository.save(session);

        notifyBoth(saved, timedOut ? "call.missed" : "call.declined");
        log.info("Call {} {} by user {}", callId, saved.getStatus(), userId);
        return mapToResponse(saved, userId);
    }

    /** Either party hangs up. */
    @Transactional
    public CallSessionResponse end(Long callId, Long userId) {
        CallSession session = requireSession(callId);
        if ("ENDED".equals(session.getStatus())) {
            return mapToResponse(session, userId);
        }
        LocalDateTime now = LocalDateTime.now();
        session.setStatus("ENDED");
        session.setEndedAt(now);
        if (session.getAcceptedAt() != null) {
            session.setDurationSeconds(Duration.between(session.getAcceptedAt(), now).getSeconds());
        }
        CallSession saved = callSessionRepository.save(session);

        notifyBoth(saved, "call.ended");
        log.info("Call {} ended by user {} after {}s", callId, userId, saved.getDurationSeconds());
        return mapToResponse(saved, userId);
    }

    /**
     * When a user's last socket closes, any call still ringing at them can never
     * be answered — close it out and tell the caller.
     */
    @Transactional
    public void expirePendingCallsForUser(Long userId) {
        List<CallSession> ringing = callSessionRepository.findByStatus("RINGING");
        for (CallSession session : ringing) {
            if (userId.equals(session.getInitiatedByUserId())) {
                continue;
            }
            Long calleeId = calleeId(session);
            if (!calleeId.equals(userId)) {
                continue;
            }
            session.setStatus("MISSED");
            session.setEndedAt(LocalDateTime.now());
            CallSession saved = callSessionRepository.save(session);
            hub.sendToUser(saved.getInitiatedByUserId(),
                    ChatEvent.of("call.missed", mapToResponse(saved, saved.getInitiatedByUserId())));
            log.info("Call {} marked missed — callee {} disconnected", saved.getId(), userId);
        }
    }

    // ---------- Media negotiation ----------

    /**
     * Relay a WebRTC signalling frame (SDP offer/answer or an ICE candidate) to
     * the other participant. The server stays out of the media path entirely —
     * it only forwards opaque payloads between the two parties.
     */
    @Transactional(readOnly = true)
    public void relaySignal(Long callId, Long fromUserId, String eventType, Map<String, Object> data) {
        if (callId == null) {
            throw new BadRequestException("callId is required for " + eventType);
        }
        CallSession session = requireSession(callId);

        Long patientId = session.getPatient().getId();
        Long professionalId = professionalUserId(session);

        Long peerId;
        if (fromUserId.equals(patientId)) {
            peerId = professionalId;
        } else if (professionalId != null && fromUserId.equals(professionalId)) {
            peerId = patientId;
        } else {
            // Not a participant of this call — refuse to relay.
            throw new BadRequestException("You are not a participant of this call.");
        }

        if (peerId == null) {
            throw new BadRequestException("This call has no reachable peer.");
        }

        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("callId", session.getId());
        if (data != null) {
            body.putAll(data);
        }
        hub.sendToUser(peerId, ChatEvent.of(eventType, body));
    }

    /**
     * ICE servers for the client's peer connection. STUN is always returned; a
     * TURN relay appears only when it is configured on the server so credentials
     * never ship inside the app bundle.
     */
    public IceServersResponse getIceServers() {
        IceServersResponse response = new IceServersResponse();

        if (webRtcProperties.getStunUrls() != null && !webRtcProperties.getStunUrls().isEmpty()) {
            response.getIceServers().add(
                    new IceServersResponse.IceServer(webRtcProperties.getStunUrls()));
        }

        if (webRtcProperties.isTurnConfigured()) {
            response.getIceServers().add(new IceServersResponse.IceServer(
                    List.of(webRtcProperties.getTurnUrl()),
                    webRtcProperties.getTurnUsername(),
                    webRtcProperties.getTurnCredential()));
            response.setRelayAvailable(true);
        }

        return response;
    }

    // ---------- History ----------

    @Transactional(readOnly = true)
    public List<CallSessionResponse> getHistory(Long userId) {
        return callSessionRepository.findAllForUser(userId).stream()
                .map(s -> mapToResponse(s, userId))
                .collect(Collectors.toList());
    }

    // ---------- Helpers ----------

    public static CallSessionResponse mapToResponse(CallSession c, Long viewerId) {
        Long patientId = c.getPatient().getId();
        Long professionalId = professionalUserId(c);
        String professionalName = professionalName(c);
        boolean viewerIsPatient = viewerId != null && viewerId.equals(patientId);

        return CallSessionResponse.builder()
                .id(c.getId())
                .patientId(patientId)
                .patientName(c.getPatient().getFullName())
                .doctorAccountId(c.getDoctorAccount() != null ? c.getDoctorAccount().getId() : null)
                .doctorUserId(professionalId)
                .doctorName(professionalName)
                .doctorSpecialization(c.getDoctorAccount() != null ? c.getDoctorAccount().getSpecialization() : null)
                .initiatedByUserId(c.getInitiatedByUserId())
                .callType(c.getCallType())
                .status(c.getStatus())
                .roomId(c.getRoomId())
                .peerUserId(viewerIsPatient ? professionalId : patientId)
                .peerName(viewerIsPatient ? professionalName : c.getPatient().getFullName())
                .createdAt(c.getCreatedAt())
                .acceptedAt(c.getAcceptedAt())
                .endedAt(c.getEndedAt())
                .durationSeconds(c.getDurationSeconds())
                .build();
    }

    /** The user id of the professional side: a doctor, or an admin support caller. */
    private static Long professionalUserId(CallSession c) {
        return c.getDoctorAccount() != null
                ? c.getDoctorAccount().getUser().getId()
                : c.getAdminUserId();
    }

    /** Display name of the professional side. */
    private static String professionalName(CallSession c) {
        return c.getDoctorAccount() != null ? c.getDoctorAccount().getFullName() : "Meditalk Admin";
    }

    private void notifyBoth(CallSession session, String eventType) {
        Long patientId = session.getPatient().getId();
        hub.sendToUser(patientId, ChatEvent.of(eventType, mapToResponse(session, patientId)));
        Long professionalId = professionalUserId(session);
        if (professionalId != null) {
            hub.sendToUser(professionalId, ChatEvent.of(eventType, mapToResponse(session, professionalId)));
        }
    }

    private Long calleeId(CallSession session) {
        return session.getInitiatedByUserId().equals(session.getPatient().getId())
                ? professionalUserId(session)
                : session.getPatient().getId();
    }

    private DoctorAccount requireDoctorAccount(User doctor) {
        return doctorAccountRepository.findByUserId(doctor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor account not found"));
    }

    private boolean isDoctor(User user) {
        return "ROLE_DOCTOR".equals(user.getRole());
    }

    private boolean isPatient(User user) {
        return "ROLE_PATIENT".equals(user.getRole());
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private CallSession requireSession(Long id) {
        return callSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Call not found with id: " + id));
    }
}
