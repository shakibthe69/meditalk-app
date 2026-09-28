package com.meditalk.dto;

/**
 * Envelope for every real-time WebSocket event.
 *
 * <p>Server → client types: {@code connected}, {@code message}, {@code typing},
 * {@code presence}, {@code call.incoming}, {@code call.ringing},
 * {@code call.accepted}, {@code call.declined}, {@code call.missed},
 * {@code call.ended}, {@code error}.
 */
public class ChatEvent {

    private String type;
    private Object payload;

    public ChatEvent() {}

    public ChatEvent(String type, Object payload) {
        this.type = type;
        this.payload = payload;
    }

    public static ChatEvent of(String type, Object payload) {
        return new ChatEvent(type, payload);
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
