package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A single audio/video call attempt between a patient and a doctor.
 *
 * <p>The call is signalled over WebSocket; the media itself is attached later
 * through {@code roomId}, which is already reserved on every session so a media
 * engine (SFU or a hosted room) can be plugged in without a schema change.
 */
@Entity
@Table(name = "call_sessions")
public class CallSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_account_id", nullable = false)
    private DoctorAccount doctorAccount;

    /** User id of whoever placed the call (either the patient or the doctor). */
    @Column(nullable = false)
    private Long initiatedByUserId;

    /** AUDIO or VIDEO. */
    @Column(nullable = false, length = 10)
    private String callType = "AUDIO";

    /** RINGING, ACCEPTED, DECLINED, MISSED or ENDED. */
    @Column(nullable = false, length = 12)
    private String status = "RINGING";

    /** Room identifier reserved for the media layer. */
    @Column(length = 64)
    private String roomId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime endedAt;

    /** Talk time in seconds, measured from accept to end. */
    private Long durationSeconds = 0L;

    public CallSession() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public DoctorAccount getDoctorAccount() { return doctorAccount; }
    public void setDoctorAccount(DoctorAccount doctorAccount) { this.doctorAccount = doctorAccount; }

    public Long getInitiatedByUserId() { return initiatedByUserId; }
    public void setInitiatedByUserId(Long initiatedByUserId) { this.initiatedByUserId = initiatedByUserId; }

    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

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
        private final CallSession session = new CallSession();

        public Builder patient(User patient) { session.setPatient(patient); return this; }
        public Builder doctorAccount(DoctorAccount doctorAccount) { session.setDoctorAccount(doctorAccount); return this; }
        public Builder initiatedByUserId(Long initiatedByUserId) { session.setInitiatedByUserId(initiatedByUserId); return this; }
        public Builder callType(String callType) { session.setCallType(callType); return this; }
        public Builder status(String status) { session.setStatus(status); return this; }
        public Builder roomId(String roomId) { session.setRoomId(roomId); return this; }

        public CallSession build() { return session; }
    }
}
