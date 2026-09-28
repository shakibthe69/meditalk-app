package com.meditalk.dto;

/**
 * One inbound command from a client socket. A single flexible shape is used so
 * the protocol stays easy to extend as new event types are added.
 *
 * <p>Supported {@code type} values: {@code ping}, {@code message}, {@code typing},
 * {@code call.invite}, {@code call.accept}, {@code call.decline}, {@code call.end},
 * plus the WebRTC media negotiation relays {@code call.offer}, {@code call.answer}
 * and {@code call.ice}.
 */
public class RealtimeInboundMessage {

    private String type;
    private Long toUserId;
    private Long callId;
    private String body;
    private String callType;
    private Boolean isTyping;
    private String reason;

    /** Session description for {@code call.offer} / {@code call.answer}. */
    private String sdp;

    /** ICE candidate for {@code call.ice}. Kept as a raw map — the server only relays it. */
    private java.util.Map<String, Object> candidate;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getToUserId() { return toUserId; }
    public void setToUserId(Long toUserId) { this.toUserId = toUserId; }

    public Long getCallId() { return callId; }
    public void setCallId(Long callId) { this.callId = callId; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }

    public Boolean getIsTyping() { return isTyping; }
    public void setIsTyping(Boolean isTyping) { this.isTyping = isTyping; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSdp() { return sdp; }
    public void setSdp(String sdp) { this.sdp = sdp; }

    public java.util.Map<String, Object> getCandidate() { return candidate; }
    public void setCandidate(java.util.Map<String, Object> candidate) { this.candidate = candidate; }
}
