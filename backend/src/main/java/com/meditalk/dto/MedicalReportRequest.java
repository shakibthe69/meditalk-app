package com.meditalk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class MedicalReportRequest {
    private Long doctorId;
    private String doctorName;

    @NotBlank(message = "Report title is required")
    private String title;

    @NotBlank(message = "Report type is required")
    private String type;

    private LocalDate testDate = LocalDate.now();
    private String hospitalOrLab;
    private String notes;
    private String fileUrl;
    private String fileType = "IMAGE";
    private String fileName;
    private Long fileSizeBytes;

    public MedicalReportRequest() {}

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
}
