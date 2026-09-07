package com.meditalk.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MedicalReportResponse {
    private Long id;
    private Long userId;
    private Long doctorId;
    private String doctorName;
    private String title;
    private String type;
    private LocalDate testDate;
    private String hospitalOrLab;
    private String notes;
    private String fileUrl;
    private String fileType;
    private String fileName;
    private Long fileSizeBytes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MedicalReportResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDate getTestDate() { return testDate; }
    public void setTestDate(LocalDate testDate) { this.testDate = testDate; }

    public String getHospitalOrLab() { return hospitalOrLab; }
    public void setHospitalOrLab(String hospitalOrLab) { this.hospitalOrLab = hospitalOrLab; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MedicalReportResponse res = new MedicalReportResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder userId(Long userId) { res.setUserId(userId); return this; }
        public Builder doctorId(Long doctorId) { res.setDoctorId(doctorId); return this; }
        public Builder doctorName(String doctorName) { res.setDoctorName(doctorName); return this; }
        public Builder title(String title) { res.setTitle(title); return this; }
        public Builder type(String type) { res.setType(type); return this; }
        public Builder testDate(LocalDate testDate) { res.setTestDate(testDate); return this; }
        public Builder hospitalOrLab(String hospitalOrLab) { res.setHospitalOrLab(hospitalOrLab); return this; }
        public Builder notes(String notes) { res.setNotes(notes); return this; }
        public Builder fileUrl(String fileUrl) { res.setFileUrl(fileUrl); return this; }
        public Builder fileType(String fileType) { res.setFileType(fileType); return this; }
        public Builder fileName(String fileName) { res.setFileName(fileName); return this; }
        public Builder fileSizeBytes(Long fileSizeBytes) { res.setFileSizeBytes(fileSizeBytes); return this; }
        public Builder createdAt(LocalDateTime createdAt) { res.setCreatedAt(createdAt); return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { res.setUpdatedAt(updatedAt); return this; }

        public MedicalReportResponse build() { return res; }
    }
}
