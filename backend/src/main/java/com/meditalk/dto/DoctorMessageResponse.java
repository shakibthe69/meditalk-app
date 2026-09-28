package com.meditalk.dto;

import java.time.LocalDateTime;

public class DoctorMessageResponse {
    private Long id;
    private Long doctorAccountId;
    private Long doctorUserId;
    private String doctorName;
    private Long patientId;
    private String patientName;
    private String body;
    private Boolean fromDoctor;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public DoctorMessageResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getDoctorAccountId() { return doctorAccountId; }
    public void setDoctorAccountId(Long doctorAccountId) { this.doctorAccountId = doctorAccountId; }

    public Long getDoctorUserId() { return doctorUserId; }
    public void setDoctorUserId(Long doctorUserId) { this.doctorUserId = doctorUserId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

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
        private final DoctorMessageResponse res = new DoctorMessageResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder doctorAccountId(Long doctorAccountId) { res.setDoctorAccountId(doctorAccountId); return this; }
        public Builder doctorUserId(Long doctorUserId) { res.setDoctorUserId(doctorUserId); return this; }
        public Builder doctorName(String doctorName) { res.setDoctorName(doctorName); return this; }
        public Builder patientId(Long patientId) { res.setPatientId(patientId); return this; }
        public Builder patientName(String patientName) { res.setPatientName(patientName); return this; }
        public Builder body(String body) { res.setBody(body); return this; }
        public Builder fromDoctor(Boolean fromDoctor) { res.setFromDoctor(fromDoctor); return this; }
        public Builder isRead(Boolean isRead) { res.setIsRead(isRead); return this; }
        public Builder createdAt(LocalDateTime createdAt) { res.setCreatedAt(createdAt); return this; }

        public DoctorMessageResponse build() { return res; }
    }
}
