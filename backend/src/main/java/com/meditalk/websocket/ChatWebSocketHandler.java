package com.meditalk.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditalk.dto.ChatEvent;
import com.meditalk.dto.RealtimeInboundMessage;

import com.meditalk.services.CallService;
import com.meditalk.services.ChatRealtimeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The single real-time endpoint of the app: {@code /ws/chat?token=<jwt>}.
 *
 * <p>Handles presence, chat delivery, typing indicators and call signalling on
 * one connection so a phone keeps exactly one socket open.
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(ChatWebSocketHandler.class);

    private final ObjectMapper objectMapper;
    private final RealtimeHub hub;
    private final ChatRealtimeService chatRealtimeService;
    private final CallService callService;

    public ChatWebSocketHandler(ObjectMapper objectMapper,
                                RealtimeHub hub,
                                ChatRealtimeService chatRealtimeService,
                                CallService callService) {
        this.objectMapper = objectMapper;
        this.hub = hub;
        this.chatRealtimeService = chatRealtimeService;
        this.callService = callService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long userId = userId(session);
        if (userId == null) {
            closeQuietly(session);
            return;
        }

        hub.register(userId, session);

        Map<String, Object> ack = new LinkedHashMap<>();
        ack.put("userId", userId);
        ack.put("onlineCount", hub.onlineUserIds().size());
        hub.sendToUser(userId, ChatEvent.of("connected", ack));

        // Let the newly connected client render live presence immediately.
        chatRealtimeService.sendPresenceSnapshot(userId);
        broadcastPresence(userId, true);

        log.info("Realtime client connected: user {} ({} socket(s))", userId, hub.sessionCount(userId));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Long userId = userId(session);
        if (userId == null) {
            closeQuietly(session);
            return;
        }

        RealtimeInboundMessage inbound;
        try {
            inbound = objectMapper.readValue(message.getPayload(), RealtimeInboundMessage.class);
        } catch (Exception e) {
            hub.sendToUser(userId, ChatEvent.of("error", "Malformed realtime payload"));
            return;
        }

        String type = inbound.getType() == null ? "" : inbound.getType().trim();
        try {
            switch (type) {
                case "ping" -> hub.sendToUser(userId, ChatEvent.of("pong", null));
                case "message" -> chatRealtimeService.sendMessage(userId, inbound.getToUserId(), inbound.getBody());
                case "typing" -> chatRealtimeService.relayTyping(userId, inbound.getToUserId(), inbound.getIsTyping());
                case "call.invite" -> callService.initiate(userId, inbound.getToUserId(), inbound.getCallType());
                case "call.accept" -> callService.accept(inbound.getCallId(), userId);
                case "call.decline" -> callService.decline(inbound.getCallId(), userId, inbound.getReason());
                case "call.end" -> callService.end(inbound.getCallId(), userId);

                // WebRTC media negotiation — relayed verbatim between the peers.
                case "call.offer" -> callService.relaySignal(
                        inbound.getCallId(), userId, "call.offer", sdpPayload(inbound.getSdp()));
                case "call.answer" -> callService.relaySignal(
                        inbound.getCallId(), userId, "call.answer", sdpPayload(inbound.getSdp()));
                case "call.ice" -> callService.relaySignal(
                        inbound.getCallId(), userId, "call.ice", candidatePayload(inbound.getCandidate()));
                default -> hub.sendToUser(userId, ChatEvent.of("error", "Unsupported event type: " + type));
            }
        } catch (Exception e) {
            log.warn("Realtime command '{}' from user {} failed: {}", type, userId, e.getMessage());
            hub.sendToUser(userId, ChatEvent.of("error", e.getMessage() == null ? "Request failed" : e.getMessage()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = userId(session);
        if (userId == null) {
            return;
        }
        boolean wentOffline = hub.unregister(userId, session);
        if (wentOffline) {
            broadcastPresence(userId, false);
            // A ringing call can never be answered once the callee is gone.
            try {
                callService.expirePendingCallsForUser(userId);
            } catch (Exception e) {
                log.warn("Could not expire pending calls for user {}", userId, e);
            }
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        Long userId = userId(session);
        log.warn("Realtime transport error for user {}: {}", userId, exception.getMessage());
        closeQuietly(session);
    }

    private Map<String, Object> sdpPayload(String sdp) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sdp", sdp);
        return payload;
    }

    private Map<String, Object> candidatePayload(Map<String, Object> candidate) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("candidate", candidate);
        return payload;
    }

    private void broadcastPresence(Long userId, boolean online) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("userId", userId);
        payload.put("online", online);
        hub.broadcast(ChatEvent.of("presence", payload));
    }

    private Long userId(WebSocketSession session) {
        Object value = session.getAttributes().get(WebSocketAuthInterceptor.ATTR_USER_ID);
        return value instanceof Long id ? id : null;
    }

    private void closeQuietly(WebSocketSession session) {
        try {
            if (session.isOpen()) {
                session.close(CloseStatus.NORMAL);
            }
        } catch (Exception ignored) {
            // nothing useful to do here
        }
    }
}
