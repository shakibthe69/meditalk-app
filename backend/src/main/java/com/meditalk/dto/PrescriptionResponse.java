package com.meditalk.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PrescriptionResponse {
    private Long id;
    private Long userId;
    private Long doctorId;
    private String doctorName;
    private String hospitalOrClinic;
    private LocalDate prescriptionDate;
    private String diagnosis;
    private String notes;
    private String imageUrl;
    private String rawOcrText;
    private List<MedicineResponse> medicines = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PrescriptionResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getHospitalOrClinic() { return hospitalOrClinic; }
    public void setHospitalOrClinic(String hospitalOrClinic) { this.hospitalOrClinic = hospitalOrClinic; }

    public LocalDate getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(LocalDate prescriptionDate) { this.prescriptionDate = prescriptionDate; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getRawOcrText() { return rawOcrText; }
    public void setRawOcrText(String rawOcrText) { this.rawOcrText = rawOcrText; }

    public List<MedicineResponse> getMedicines() { return medicines; }
    public void setMedicines(List<MedicineResponse> medicines) { this.medicines = medicines; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final PrescriptionResponse res = new PrescriptionResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder userId(Long userId) { res.setUserId(userId); return this; }
        public Builder doctorId(Long doctorId) { res.setDoctorId(doctorId); return this; }
        public Builder doctorName(String doctorName) { res.setDoctorName(doctorName); return this; }
        public Builder hospitalOrClinic(String hospitalOrClinic) { res.setHospitalOrClinic(hospitalOrClinic); return this; }
        public Builder prescriptionDate(LocalDate date) { res.setPrescriptionDate(date); return this; }
        public Builder diagnosis(String diagnosis) { res.setDiagnosis(diagnosis); return this; }
        public Builder notes(String notes) { res.setNotes(notes); return this; }
        public Builder imageUrl(String imageUrl) { res.setImageUrl(imageUrl); return this; }
        public Builder rawOcrText(String rawOcrText) { res.setRawOcrText(rawOcrText); return this; }
        public Builder medicines(List<MedicineResponse> medicines) { res.setMedicines(medicines); return this; }
        public Builder createdAt(LocalDateTime createdAt) { res.setCreatedAt(createdAt); return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { res.setUpdatedAt(updatedAt); return this; }

        public PrescriptionResponse build() { return res; }
    }
}
