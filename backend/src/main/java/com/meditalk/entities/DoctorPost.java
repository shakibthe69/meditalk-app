package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * A health update or announcement posted by a doctor account.
 * Visible to patients on their dashboard newsfeed.
 */
@Entity
@Table(name = "doctor_posts")
public class DoctorPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_account_id", nullable = false)
    private DoctorAccount doctorAccount;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** Optional category tag, e.g. NOTICE, HEALTH_TIP, ALERT, CAMPAIGN. */
    @Column(length = 30)
    private String category;

    /** Optional image or banner URL uploaded with the post. */
    @Column(length = 500)
    private String imageUrl;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public DoctorPost() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DoctorAccount getDoctorAccount() { return doctorAccount; }
    public void setDoctorAccount(DoctorAccount doctorAccount) { this.doctorAccount = doctorAccount; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DoctorPost post = new DoctorPost();

        public Builder doctorAccount(DoctorAccount doctorAccount) { post.setDoctorAccount(doctorAccount); return this; }
        public Builder title(String title) { post.setTitle(title); return this; }
        public Builder body(String body) { post.setBody(body); return this; }
        public Builder category(String category) { post.setCategory(category); return this; }
        public Builder imageUrl(String imageUrl) { post.setImageUrl(imageUrl); return this; }

        public DoctorPost build() { return post; }
    }
}
