package com.meditalk.dto;

import java.time.LocalDateTime;

/**
 * A call session as seen by one participant. {@code peerUserId} / {@code peerName}
 * are resolved relative to the viewer so the same payload serves both the
 * patient's and the doctor's call history.
 */
public class CallSessionResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private Long doctorAccountId;
    private Long doctorUserId;
    private String doctorName;
    private String doctorSpecialization;
    private Long initiatedByUserId;
    private String callType;
    private String status;
    private String roomId;
    private Long peerUserId;
    private String peerName;
    private LocalDateTime createdAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime endedAt;
    private Long durationSeconds;

    public CallSessionResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public Long getDoctorAccountId() { return doctorAccountId; }
    public void setDoctorAccountId(Long doctorAccountId) { this.doctorAccountId = doctorAccountId; }

    public Long getDoctorUserId() { return doctorUserId; }
    public void setDoctorUserId(Long doctorUserId) { this.doctorUserId = doctorUserId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }

    public Long getInitiatedByUserId() { return initiatedByUserId; }
    public void setInitiatedByUserId(Long initiatedByUserId) { this.initiatedByUserId = initiatedByUserId; }

    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public Long getPeerUserId() { return peerUserId; }
    public void setPeerUserId(Long peerUserId) { this.peerUserId = peerUserId; }

    public String getPeerName() { return peerName; }
    public void setPeerName(String peerName) { this.peerName = peerName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }

    public Long getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Long durationSeconds) { this.durationSeconds = durationSeconds; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final CallSessionResponse res = new CallSessionResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder patientId(Long patientId) { res.setPatientId(patientId); return this; }
        public Builder patientName(String patientName) { res.setPatientName(patientName); return this; }
        public Builder doctorAccountId(Long doctorAccountId) { res.setDoctorAccountId(doctorAccountId); return this; }
        public Builder doctorUserId(Long doctorUserId) { res.setDoctorUserId(doctorUserId); return this; }
        public Builder doctorName(String doctorName) { res.setDoctorName(doctorName); return this; }
        public Builder doctorSpecialization(String doctorSpecialization) { res.setDoctorSpecialization(doctorSpecialization); return this; }
        public Builder initiatedByUserId(Long initiatedByUserId) { res.setInitiatedByUserId(initiatedByUserId); return this; }
        public Builder callType(String callType) { res.setCallType(callType); return this; }
        public Builder status(String status) { res.setStatus(status); return this; }
        public Builder roomId(String roomId) { res.setRoomId(roomId); return this; }
        public Builder peerUserId(Long peerUserId) { res.setPeerUserId(peerUserId); return this; }
        public Builder peerName(String peerName) { res.setPeerName(peerName); return this; }
        public Builder createdAt(LocalDateTime createdAt) { res.setCreatedAt(createdAt); return this; }
        public Builder acceptedAt(LocalDateTime acceptedAt) { res.setAcceptedAt(acceptedAt); return this; }
        public Builder endedAt(LocalDateTime endedAt) { res.setEndedAt(endedAt); return this; }
        public Builder durationSeconds(Long durationSeconds) { res.setDurationSeconds(durationSeconds); return this; }

        public CallSessionResponse build() { return res; }
    }
}
