package com.meditalk.dto;

import java.util.ArrayList;
import java.util.List;

public class MedicalHistoryPdfRequest {
    private boolean includePatientInfo = true;
    private boolean includePrescriptions = true;
    private boolean includeActiveMedicines = true;
    private boolean includeReports = true;
    private boolean includeDoctorVisits = true;
    private List<Long> selectedPrescriptionIds = new ArrayList<>();
    private List<Long> selectedReportIds = new ArrayList<>();
    private List<Long> selectedMedicineIds = new ArrayList<>();

    public MedicalHistoryPdfRequest() {}

    public boolean isIncludePatientInfo() { return includePatientInfo; }
    public void setIncludePatientInfo(boolean includePatientInfo) { this.includePatientInfo = includePatientInfo; }

    public boolean isIncludePrescriptions() { return includePrescriptions; }
    public void setIncludePrescriptions(boolean includePrescriptions) { this.includePrescriptions = includePrescriptions; }

    public boolean isIncludeActiveMedicines() { return includeActiveMedicines; }
    public void setIncludeActiveMedicines(boolean includeActiveMedicines) { this.includeActiveMedicines = includeActiveMedicines; }

    public boolean isIncludeReports() { return includeReports; }
    public void setIncludeReports(boolean includeReports) { this.includeReports = includeReports; }

    public boolean isIncludeDoctorVisits() { return includeDoctorVisits; }
    public void setIncludeDoctorVisits(boolean includeDoctorVisits) { this.includeDoctorVisits = includeDoctorVisits; }

    public List<Long> getSelectedPrescriptionIds() { return selectedPrescriptionIds; }
    public void setSelectedPrescriptionIds(List<Long> selectedPrescriptionIds) { this.selectedPrescriptionIds = selectedPrescriptionIds; }

    public List<Long> getSelectedReportIds() { return selectedReportIds; }
    public void setSelectedReportIds(List<Long> selectedReportIds) { this.selectedReportIds = selectedReportIds; }

    public List<Long> getSelectedMedicineIds() { return selectedMedicineIds; }
    public void setSelectedMedicineIds(List<Long> selectedMedicineIds) { this.selectedMedicineIds = selectedMedicineIds; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MedicalHistoryPdfRequest req = new MedicalHistoryPdfRequest();

        public Builder includePatientInfo(boolean v) { req.setIncludePatientInfo(v); return this; }
        public Builder includePrescriptions(boolean v) { req.setIncludePrescriptions(v); return this; }
        public Builder includeActiveMedicines(boolean v) { req.setIncludeActiveMedicines(v); return this; }
        public Builder includeReports(boolean v) { req.setIncludeReports(v); return this; }
        public Builder includeDoctorVisits(boolean v) { req.setIncludeDoctorVisits(v); return this; }
        public Builder selectedPrescriptionIds(List<Long> ids) { req.setSelectedPrescriptionIds(ids); return this; }
        public Builder selectedReportIds(List<Long> ids) { req.setSelectedReportIds(ids); return this; }
        public Builder selectedMedicineIds(List<Long> ids) { req.setSelectedMedicineIds(ids); return this; }

        public MedicalHistoryPdfRequest build() { return req; }
    }
}
