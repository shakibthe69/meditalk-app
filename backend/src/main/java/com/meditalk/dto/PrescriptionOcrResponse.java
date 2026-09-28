package com.meditalk.dto;

import java.util.ArrayList;
import java.util.List;

public class PrescriptionOcrResponse {
    private boolean success = true;
    private String text;
    private String rawOcrText;
    private String imageUrl;
    private List<String> detectedLanguages = new ArrayList<>();
    private double confidenceScore = 0.95;
    private String preprocessingSummary;
    /** "gemini" when the structured draft came from the prescription AI, "rule-based" otherwise. */
    private String extractionSource = "rule-based";
    /** Which OCR provider read the image ("ocr.space" or "google-cloud-vision"). */
    private String ocrEngine;
    /** Human readable explanation of what happened during extraction. */
    private String aiNotes;
    private boolean requiresUserVerification = true;
    private String safetyDisclaimer = "Meditalk helps organize your prescription text. Please verify all extracted text and details with your original prescription.";
    private String doctorName;
    private String hospitalOrClinic;
    private String prescriptionDate;
    private String diagnosis;
    private List<ExtractedMedicineDto> medicines = new ArrayList<>();

    public PrescriptionOcrResponse() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getText() { return text != null ? text : rawOcrText; }
    public void setText(String text) {
        this.text = text;
        if (this.rawOcrText == null) this.rawOcrText = text;
    }

    public String getRawOcrText() { return rawOcrText != null ? rawOcrText : text; }
    public void setRawOcrText(String rawOcrText) {
        this.rawOcrText = rawOcrText;
        if (this.text == null) this.text = rawOcrText;
    }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public List<String> getDetectedLanguages() { return detectedLanguages; }
    public void setDetectedLanguages(List<String> detectedLanguages) { this.detectedLanguages = detectedLanguages; }

    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getPreprocessingSummary() { return preprocessingSummary; }
    public void setPreprocessingSummary(String preprocessingSummary) { this.preprocessingSummary = preprocessingSummary; }

    public String getExtractionSource() { return extractionSource; }
    public void setExtractionSource(String extractionSource) { this.extractionSource = extractionSource; }

    public String getOcrEngine() { return ocrEngine; }
    public void setOcrEngine(String ocrEngine) { this.ocrEngine = ocrEngine; }

    public String getAiNotes() { return aiNotes; }
    public void setAiNotes(String aiNotes) { this.aiNotes = aiNotes; }

    public boolean isRequiresUserVerification() { return requiresUserVerification; }
    public void setRequiresUserVerification(boolean requiresUserVerification) { this.requiresUserVerification = requiresUserVerification; }

    public String getSafetyDisclaimer() { return safetyDisclaimer; }
    public void setSafetyDisclaimer(String safetyDisclaimer) { this.safetyDisclaimer = safetyDisclaimer; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getHospitalOrClinic() { return hospitalOrClinic; }
    public void setHospitalOrClinic(String hospitalOrClinic) { this.hospitalOrClinic = hospitalOrClinic; }

    public String getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(String prescriptionDate) { this.prescriptionDate = prescriptionDate; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public List<ExtractedMedicineDto> getMedicines() { return medicines; }
    public void setMedicines(List<ExtractedMedicineDto> medicines) { this.medicines = medicines; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final PrescriptionOcrResponse res = new PrescriptionOcrResponse();

        public Builder success(boolean success) { res.setSuccess(success); return this; }
        public Builder text(String text) { res.setText(text); return this; }
        public Builder rawOcrText(String rawOcrText) { res.setRawOcrText(rawOcrText); return this; }
        public Builder imageUrl(String imageUrl) { res.setImageUrl(imageUrl); return this; }
        public Builder detectedLanguages(List<String> detectedLanguages) { res.setDetectedLanguages(detectedLanguages); return this; }
        public Builder confidenceScore(double confidenceScore) { res.setConfidenceScore(confidenceScore); return this; }
        public Builder preprocessingSummary(String preprocessingSummary) { res.setPreprocessingSummary(preprocessingSummary); return this; }
        public Builder extractionSource(String extractionSource) { res.setExtractionSource(extractionSource); return this; }
        public Builder ocrEngine(String ocrEngine) { res.setOcrEngine(ocrEngine); return this; }
        public Builder aiNotes(String aiNotes) { res.setAiNotes(aiNotes); return this; }
        public Builder requiresUserVerification(boolean requiresUserVerification) { res.setRequiresUserVerification(requiresUserVerification); return this; }
        public Builder safetyDisclaimer(String safetyDisclaimer) { res.setSafetyDisclaimer(safetyDisclaimer); return this; }
        public Builder doctorName(String doctorName) { res.setDoctorName(doctorName); return this; }
        public Builder hospitalOrClinic(String hospitalOrClinic) { res.setHospitalOrClinic(hospitalOrClinic); return this; }
        public Builder prescriptionDate(String prescriptionDate) { res.setPrescriptionDate(prescriptionDate); return this; }
        public Builder diagnosis(String diagnosis) { res.setDiagnosis(diagnosis); return this; }
        public Builder medicines(List<ExtractedMedicineDto> medicines) { res.setMedicines(medicines); return this; }

        public PrescriptionOcrResponse build() { return res; }
    }
}
