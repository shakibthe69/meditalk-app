package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_reports")
public class MedicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Column(length = 100)
    private String doctorName;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false)
    private LocalDate testDate;

    @Column(length = 150)
    private String hospitalOrLab;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, length = 500)
    private String fileUrl;

    @Column(nullable = false, length = 10)
    private String fileType = "IMAGE";

    @Column(nullable = false, length = 255)
    private String fileName;

    private Long fileSizeBytes;

    /**
     * Raw uploaded bytes, kept verbatim in the database so the original report
     * image survives even if the uploads folder is cleared, and so the generated
     * PDF can embed the exact image the patient uploaded. Never re-encoded here.
     */
    @Lob
    @Column(name = "file_data", columnDefinition = "MEDIUMBLOB")
    private byte[] fileData;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public MedicalReport() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

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

    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MedicalReport r = new MedicalReport();

        public Builder id(Long id) { r.setId(id); return this; }
        public Builder user(User user) { r.setUser(user); return this; }
        public Builder doctor(Doctor doctor) { r.setDoctor(doctor); return this; }
        public Builder doctorName(String doctorName) { r.setDoctorName(doctorName); return this; }
        public Builder title(String title) { r.setTitle(title); return this; }
        public Builder type(String type) { r.setType(type); return this; }
        public Builder testDate(LocalDate testDate) { r.setTestDate(testDate); return this; }
        public Builder hospitalOrLab(String hospitalOrLab) { r.setHospitalOrLab(hospitalOrLab); return this; }
        public Builder notes(String notes) { r.setNotes(notes); return this; }
        public Builder fileUrl(String fileUrl) { r.setFileUrl(fileUrl); return this; }
        public Builder fileType(String fileType) { r.setFileType(fileType); return this; }
        public Builder fileName(String fileName) { r.setFileName(fileName); return this; }
        public Builder fileSizeBytes(Long fileSizeBytes) { r.setFileSizeBytes(fileSizeBytes); return this; }
        public Builder fileData(byte[] fileData) { r.setFileData(fileData); return this; }

        public MedicalReport build() { return r; }
    }
}
