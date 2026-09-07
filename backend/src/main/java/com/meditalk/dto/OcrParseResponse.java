package com.meditalk.dto;

import java.util.ArrayList;
import java.util.List;

public class OcrParseResponse {
    private String doctorName;
    private String hospitalOrClinic;
    private String prescriptionDate;
    private String diagnosis;
    private String rawOcrText;
    private List<ExtractedMedicineDto> medicines = new ArrayList<>();
    private String notes;
    private boolean requiresUserVerification = true;
    private String safetyDisclaimer;

    public OcrParseResponse() {}

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getHospitalOrClinic() { return hospitalOrClinic; }
    public void setHospitalOrClinic(String hospitalOrClinic) { this.hospitalOrClinic = hospitalOrClinic; }

    public String getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(String prescriptionDate) { this.prescriptionDate = prescriptionDate; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getRawOcrText() { return rawOcrText; }
    public void setRawOcrText(String rawOcrText) { this.rawOcrText = rawOcrText; }

    public List<ExtractedMedicineDto> getMedicines() { return medicines; }
    public void setMedicines(List<ExtractedMedicineDto> medicines) { this.medicines = medicines; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isRequiresUserVerification() { return requiresUserVerification; }
    public void setRequiresUserVerification(boolean requiresUserVerification) { this.requiresUserVerification = requiresUserVerification; }

    public String getSafetyDisclaimer() { return safetyDisclaimer; }
    public void setSafetyDisclaimer(String safetyDisclaimer) { this.safetyDisclaimer = safetyDisclaimer; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final OcrParseResponse res = new OcrParseResponse();

        public Builder doctorName(String doctorName) { res.setDoctorName(doctorName); return this; }
        public Builder hospitalOrClinic(String hospitalOrClinic) { res.setHospitalOrClinic(hospitalOrClinic); return this; }
        public Builder prescriptionDate(String prescriptionDate) { res.setPrescriptionDate(prescriptionDate); return this; }
        public Builder diagnosis(String diagnosis) { res.setDiagnosis(diagnosis); return this; }
        public Builder rawOcrText(String rawOcrText) { res.setRawOcrText(rawOcrText); return this; }
        public Builder medicines(List<ExtractedMedicineDto> medicines) { res.setMedicines(medicines); return this; }
        public Builder notes(String notes) { res.setNotes(notes); return this; }
        public Builder requiresUserVerification(boolean requiresUserVerification) { res.setRequiresUserVerification(requiresUserVerification); return this; }
        public Builder safetyDisclaimer(String safetyDisclaimer) { res.setSafetyDisclaimer(safetyDisclaimer); return this; }

        public OcrParseResponse build() { return res; }
    }
}
