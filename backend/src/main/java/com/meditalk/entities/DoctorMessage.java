package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A two-way chat message between a doctor account and a patient.
 */
@Entity
@Table(name = "doctor_messages")
public class DoctorMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_account_id", nullable = false)
    private DoctorAccount doctorAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** True if the doctor authored the message, false if the patient did. */
    @Column(nullable = false)
    private Boolean fromDoctor = true;

    /** Set by the recipient when they view the message. */
    @Column(nullable = false)
    private Boolean isRead = Boolean.FALSE;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public DoctorMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DoctorAccount getDoctorAccount() { return doctorAccount; }
    public void setDoctorAccount(DoctorAccount doctorAccount) { this.doctorAccount = doctorAccount; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Boolean getFromDoctor() { return fromDoctor; }
    public void setFromDoctor(Boolean fromDoctor) { this.fromDoctor = fromDoctor; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DoctorMessage message = new DoctorMessage();

        public Builder doctorAccount(DoctorAccount doctorAccount) { message.setDoctorAccount(doctorAccount); return this; }
        public Builder patient(User patient) { message.setPatient(patient); return this; }
        public Builder body(String body) { message.setBody(body); return this; }
        public Builder fromDoctor(Boolean fromDoctor) { message.setFromDoctor(fromDoctor); return this; }

        public DoctorMessage build() { return message; }
    }
}
