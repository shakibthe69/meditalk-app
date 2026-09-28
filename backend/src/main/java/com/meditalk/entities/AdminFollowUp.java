package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * One administrative follow-up row per patient.
 *
 * <p>The {@code priority} is recomputed from inactivity + medication signals and
 * represents <em>administrative follow-up priority</em>, never medical severity.
 * {@code status} tracks the admin workflow (OPEN → CONTACTED → RESOLVED).
 */
@Entity
@Table(name = "admin_follow_ups", uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
public class AdminFollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** NORMAL | MONITOR | FOLLOW_UP | HIGH_PRIORITY */
    @Column(nullable = false, length = 20)
    private String priority = "NORMAL";

    /** OPEN | CONTACTED | RESOLVED */
    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(columnDefinition = "TEXT")
    private String reason;

    private int inactiveDays;

    private int unconfirmedDoses;

    private Integer adherencePercent;

    private LocalDateTime lastContactedAt;

    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public AdminFollowUp() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public int getInactiveDays() { return inactiveDays; }
    public void setInactiveDays(int inactiveDays) { this.inactiveDays = inactiveDays; }

    public int getUnconfirmedDoses() { return unconfirmedDoses; }
    public void setUnconfirmedDoses(int unconfirmedDoses) { this.unconfirmedDoses = unconfirmedDoses; }

    public Integer getAdherencePercent() { return adherencePercent; }
    public void setAdherencePercent(Integer adherencePercent) { this.adherencePercent = adherencePercent; }

    public LocalDateTime getLastContactedAt() { return lastContactedAt; }
    public void setLastContactedAt(LocalDateTime lastContactedAt) { this.lastContactedAt = lastContactedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
