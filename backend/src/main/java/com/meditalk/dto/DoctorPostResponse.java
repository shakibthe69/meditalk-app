package com.meditalk.dto;

import java.time.LocalDateTime;

public class DoctorPostResponse {
    private Long id;
    private Long doctorAccountId;
    private String doctorName;
    private String doctorSpecialization;
    private String title;
    private String body;
    private String category;
    private String imageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DoctorPostResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDoctorAccountId() { return doctorAccountId; }
    public void setDoctorAccountId(Long doctorAccountId) { this.doctorAccountId = doctorAccountId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }

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
        private final DoctorPostResponse res = new DoctorPostResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder doctorAccountId(Long doctorAccountId) { res.setDoctorAccountId(doctorAccountId); return this; }
        public Builder doctorName(String doctorName) { res.setDoctorName(doctorName); return this; }
        public Builder doctorSpecialization(String doctorSpecialization) { res.setDoctorSpecialization(doctorSpecialization); return this; }
        public Builder title(String title) { res.setTitle(title); return this; }
        public Builder body(String body) { res.setBody(body); return this; }
        public Builder category(String category) { res.setCategory(category); return this; }
        public Builder imageUrl(String imageUrl) { res.setImageUrl(imageUrl); return this; }
        public Builder createdAt(LocalDateTime createdAt) { res.setCreatedAt(createdAt); return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { res.setUpdatedAt(updatedAt); return this; }

        public DoctorPostResponse build() { return res; }
    }
}
