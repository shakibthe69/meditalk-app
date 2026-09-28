package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Audit trail for sensitive administrative actions: which admin did what, to
 * which patient, and when. Only stores identifiers and action names — never
 * clinical detail.
 */
@Entity
@Table(name = "admin_audit_logs")
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User adminUser;

    /** VIEW_PATIENT | CONTACT | ADD_NOTE | CHANGE_STATUS | RESOLVE_HELP | SEND_NOTIFICATION */
    @Column(nullable = false, length = 40)
    private String action;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(length = 250)
    private String detail;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public AdminAuditLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getAdminUser() { return adminUser; }
    public void setAdminUser(User adminUser) { this.adminUser = adminUser; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
