package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A single message in a patient ↔ Meditalk-admin conversation.
 *
 * <p>Kept separate from {@link DoctorMessage} because an admin is neither a
 * doctor nor a patient: a dedicated table keeps the doctor↔patient store free of
 * non-clinical traffic and lets the admin inbox be queried on its own.</p>
 */
@Entity
@Table(name = "admin_messages")
public class AdminMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    /** The admin who replied, when the message came from the panel. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private User admin;

    @Column(nullable = false)
    private boolean fromAdmin = false;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** Read by the admin (for patient messages); patient reads are not tracked. */
    @Column(nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public AdminMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public User getAdmin() { return admin; }
    public void setAdmin(User admin) { this.admin = admin; }

    public boolean isFromAdmin() { return fromAdmin; }
    public void setFromAdmin(boolean fromAdmin) { this.fromAdmin = fromAdmin; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final AdminMessage m = new AdminMessage();

        public Builder patient(User patient) { m.setPatient(patient); return this; }
        public Builder admin(User admin) { m.setAdmin(admin); return this; }
        public Builder fromAdmin(boolean fromAdmin) { m.setFromAdmin(fromAdmin); return this; }
        public Builder body(String body) { m.setBody(body); return this; }
        public Builder read(boolean read) { m.setRead(read); return this; }

        public AdminMessage build() { return m; }
    }
}
