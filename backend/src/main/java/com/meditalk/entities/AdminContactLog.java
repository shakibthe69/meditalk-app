package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * One row per administrator contact attempt (call, message or notification).
 *
 * <p>Every contact action taken from the Admin Panel is recorded here so the
 * follow-up history answers who contacted the patient, when and with what
 * result. {@code note} is free text from the admin and never alters clinical
 * records.
 */
@Entity
@Table(name = "admin_contact_logs")
public class AdminContactLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follow_up_id")
    private AdminFollowUp followUp;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User adminUser;

    /** PHONE | MESSAGE | NOTIFICATION */
    @Column(nullable = false, length = 20)
    private String type;

    /** Free-form outcome, e.g. "Patient answered". */
    @Column(length = 120)
    private String result;

    @Column(columnDefinition = "TEXT")
    private String note;

    /** Optional payload sent to the patient (notification title/body). */
    @Column(length = 200)
    private String subject;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public AdminContactLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AdminFollowUp getFollowUp() { return followUp; }
    public void setFollowUp(AdminFollowUp followUp) { this.followUp = followUp; }

    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }

    public User getAdminUser() { return adminUser; }
    public void setAdminUser(User adminUser) { this.adminUser = adminUser; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
