package com.meditalk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class PrescriptionRequest {
    private Long doctorId;

    @NotBlank(message = "Doctor name is required")
    private String doctorName;

    private String hospitalOrClinic;

    @NotNull(message = "Prescription date is required")
    private LocalDate prescriptionDate;

    private String diagnosis;
    private String notes;
    private String imageUrl;
    private String rawOcrText;
    /**
     * Set to true only after the patient has explicitly confirmed that they want to save
     * a prescription that matches one already in their records.
     */
    private Boolean allowDuplicate = false;
    private List<MedicineRequest> medicines = new ArrayList<>();

    public PrescriptionRequest() {}

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

    public Boolean getAllowDuplicate() { return allowDuplicate; }
    public void setAllowDuplicate(Boolean allowDuplicate) { this.allowDuplicate = allowDuplicate; }

    public List<MedicineRequest> getMedicines() { return medicines; }
    public void setMedicines(List<MedicineRequest> medicines) { this.medicines = medicines; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final PrescriptionRequest req = new PrescriptionRequest();

        public Builder doctorId(Long doctorId) { req.setDoctorId(doctorId); return this; }
        public Builder doctorName(String doctorName) { req.setDoctorName(doctorName); return this; }
        public Builder hospitalOrClinic(String hospitalOrClinic) { req.setHospitalOrClinic(hospitalOrClinic); return this; }
        public Builder prescriptionDate(LocalDate date) { req.setPrescriptionDate(date); return this; }
        public Builder diagnosis(String diagnosis) { req.setDiagnosis(diagnosis); return this; }
        public Builder notes(String notes) { req.setNotes(notes); return this; }
        public Builder imageUrl(String imageUrl) { req.setImageUrl(imageUrl); return this; }
        public Builder rawOcrText(String rawOcrText) { req.setRawOcrText(rawOcrText); return this; }
        public Builder allowDuplicate(Boolean allowDuplicate) { req.setAllowDuplicate(allowDuplicate); return this; }
        public Builder medicines(List<MedicineRequest> medicines) { req.setMedicines(medicines); return this; }

        public PrescriptionRequest build() { return req; }
    }
}
