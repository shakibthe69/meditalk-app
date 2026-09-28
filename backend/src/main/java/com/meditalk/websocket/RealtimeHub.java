package com.meditalk.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditalk.dto.ChatEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Keeps track of every open real-time session and doubles as the presence
 * registry: a user is "online" while they hold at least one live socket.
 *
 * <p>A user may hold several sessions at once (phone + web), so sessions are
 * counted per user and the user only goes offline when the last one closes.
 */
@Component
public class RealtimeHub {

    private static final Logger log = LoggerFactory.getLogger(RealtimeHub.class);

    private final ObjectMapper objectMapper;
    private final Map<Long, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();

    public RealtimeHub(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(Long userId, WebSocketSession session) {
        sessionsByUser.computeIfAbsent(userId, k -> Collections.newSetFromMap(new ConcurrentHashMap<>()))
                .add(session);
        log.debug("Realtime session opened for user {} (now {} session(s))", userId, sessionCount(userId));
    }

    /** @return true when this was the user's last session, i.e. they just went offline. */
    public boolean unregister(Long userId, WebSocketSession session) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null) {
            return false;
        }
        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByUser.remove(userId);
            log.debug("Realtime session closed for user {} — now offline", userId);
            return true;
        }
        return false;
    }

    public boolean isOnline(Long userId) {
        if (userId == null) return false;
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    public Set<Long> onlineUserIds() {
        return Collections.unmodifiableSet(sessionsByUser.keySet());
    }

    public int sessionCount(Long userId) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        return sessions == null ? 0 : sessions.size();
    }

    /**
     * Deliver an event to every open session of one user.
     *
     * @return true if at least one session received it, false if the user is offline.
     */
    public boolean sendToUser(Long userId, ChatEvent event) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return false;
        }
        String json;
        try {
            json = objectMapper.writeValueAsString(event);
        } catch (IOException e) {
            log.error("Could not serialise realtime event {}", event.getType(), e);
            return false;
        }

        boolean delivered = false;
        for (WebSocketSession session : sessions) {
            if (send(session, json)) {
                delivered = true;
            }
        }
        return delivered;
    }

    /** Fan out an event to every connected user. */
    public void broadcast(ChatEvent event) {
        String json;
        try {
            json = objectMapper.writeValueAsString(event);
        } catch (IOException e) {
            log.error("Could not serialise broadcast event {}", event.getType(), e);
            return;
        }
        sessionsByUser.values().forEach(sessions -> sessions.forEach(s -> send(s, json)));
    }

    private boolean send(WebSocketSession session, String json) {
        if (!session.isOpen()) {
            return false;
        }
        try {
            // Concurrent sends on the same session are not allowed by the spec.
            synchronized (session) {
                session.sendMessage(new TextMessage(json));
            }
            return true;
        } catch (IOException | IllegalStateException e) {
            log.warn("Failed to deliver realtime event to session {}", session.getId(), e);
            return false;
        }
    }
}
