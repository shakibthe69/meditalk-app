package com.meditalk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public class DiseaseRequestDto {

    @NotBlank(message = "English name is required")
    private String nameEn;

    @NotBlank(message = "Bangla name is required")
    private String nameBn;

    private String slug;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String subcategoryEn;
    private String subcategoryBn;

    private String alternativeNamesEn;
    private String alternativeNamesBn;

    private String overviewEn;
    private String overviewBn;

    private String diagnosisEn;
    private String diagnosisBn;

    private String treatmentOverviewEn;
    private String treatmentOverviewBn;

    private String homeCareEn;
    private String homeCareBn;

    private String dietLifestyleEn;
    private String dietLifestyleBn;

    private String preventionEn;
    private String preventionBn;

    private String doctorVisitEn;
    private String doctorVisitBn;

    private String emergencyEn;
    private String emergencyBn;

    private String durationEn;
    private String durationBn;

    private Boolean isPopular = false;
    private String status = "PUBLISHED";

    private String sourceName;
    private String sourceUrl;
    private String referenceNote;
    private LocalDate lastReviewedAt;

    private List<SymptomItem> symptoms;
    private List<CauseItem> causes;
    private List<RiskFactorItem> riskFactors;
    private List<MedicineInfoItem> medicines;
    private List<WarningSignItem> warningSigns;
    private List<Long> relatedDiseaseIds;

    public DiseaseRequestDto() {}

    // Getters & Setters
    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getNameBn() { return nameBn; }
    public void setNameBn(String nameBn) { this.nameBn = nameBn; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getSubcategoryEn() { return subcategoryEn; }
    public void setSubcategoryEn(String subcategoryEn) { this.subcategoryEn = subcategoryEn; }

    public String getSubcategoryBn() { return subcategoryBn; }
    public void setSubcategoryBn(String subcategoryBn) { this.subcategoryBn = subcategoryBn; }

    public String getAlternativeNamesEn() { return alternativeNamesEn; }
    public void setAlternativeNamesEn(String alternativeNamesEn) { this.alternativeNamesEn = alternativeNamesEn; }

    public String getAlternativeNamesBn() { return alternativeNamesBn; }
    public void setAlternativeNamesBn(String alternativeNamesBn) { this.alternativeNamesBn = alternativeNamesBn; }

    public String getOverviewEn() { return overviewEn; }
    public void setOverviewEn(String overviewEn) { this.overviewEn = overviewEn; }

    public String getOverviewBn() { return overviewBn; }
    public void setOverviewBn(String overviewBn) { this.overviewBn = overviewBn; }

    public String getDiagnosisEn() { return diagnosisEn; }
    public void setDiagnosisEn(String diagnosisEn) { this.diagnosisEn = diagnosisEn; }

    public String getDiagnosisBn() { return diagnosisBn; }
    public void setDiagnosisBn(String diagnosisBn) { this.diagnosisBn = diagnosisBn; }

    public String getTreatmentOverviewEn() { return treatmentOverviewEn; }
    public void setTreatmentOverviewEn(String treatmentOverviewEn) { this.treatmentOverviewEn = treatmentOverviewEn; }

    public String getTreatmentOverviewBn() { return treatmentOverviewBn; }
    public void setTreatmentOverviewBn(String treatmentOverviewBn) { this.treatmentOverviewBn = treatmentOverviewBn; }

    public String getHomeCareEn() { return homeCareEn; }
    public void setHomeCareEn(String homeCareEn) { this.homeCareEn = homeCareEn; }

    public String getHomeCareBn() { return homeCareBn; }
    public void setHomeCareBn(String homeCareBn) { this.homeCareBn = homeCareBn; }

    public String getDietLifestyleEn() { return dietLifestyleEn; }
    public void setDietLifestyleEn(String dietLifestyleEn) { this.dietLifestyleEn = dietLifestyleEn; }

    public String getDietLifestyleBn() { return dietLifestyleBn; }
    public void setDietLifestyleBn(String dietLifestyleBn) { this.dietLifestyleBn = dietLifestyleBn; }

    public String getPreventionEn() { return preventionEn; }
    public void setPreventionEn(String preventionEn) { this.preventionEn = preventionEn; }

    public String getPreventionBn() { return preventionBn; }
    public void setPreventionBn(String preventionBn) { this.preventionBn = preventionBn; }

    public String getDoctorVisitEn() { return doctorVisitEn; }
    public void setDoctorVisitEn(String doctorVisitEn) { this.doctorVisitEn = doctorVisitEn; }

    public String getDoctorVisitBn() { return doctorVisitBn; }
    public void setDoctorVisitBn(String doctorVisitBn) { this.doctorVisitBn = doctorVisitBn; }

    public String getEmergencyEn() { return emergencyEn; }
    public void setEmergencyEn(String emergencyEn) { this.emergencyEn = emergencyEn; }

    public String getEmergencyBn() { return emergencyBn; }
    public void setEmergencyBn(String emergencyBn) { this.emergencyBn = emergencyBn; }

    public String getDurationEn() { return durationEn; }
    public void setDurationEn(String durationEn) { this.durationEn = durationEn; }

    public String getDurationBn() { return durationBn; }
    public void setDurationBn(String durationBn) { this.durationBn = durationBn; }

    public Boolean getIsPopular() { return isPopular; }
    public void setIsPopular(Boolean popular) { isPopular = popular; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSourceName() { return sourceName; }
    public void setSourceName(String sourceName) { this.sourceName = sourceName; }

    public String getSourceUrl() { return sourceUrl; }
    public void setSourceUrl(String sourceUrl) { this.sourceUrl = sourceUrl; }

    public String getReferenceNote() { return referenceNote; }
    public void setReferenceNote(String referenceNote) { this.referenceNote = referenceNote; }

    public LocalDate getLastReviewedAt() { return lastReviewedAt; }
    public void setLastReviewedAt(LocalDate lastReviewedAt) { this.lastReviewedAt = lastReviewedAt; }

    public List<SymptomItem> getSymptoms() { return symptoms; }
    public void setSymptoms(List<SymptomItem> symptoms) { this.symptoms = symptoms; }

    public List<CauseItem> getCauses() { return causes; }
    public void setCauses(List<CauseItem> causes) { this.causes = causes; }

    public List<RiskFactorItem> getRiskFactors() { return riskFactors; }
    public void setRiskFactors(List<RiskFactorItem> riskFactors) { this.riskFactors = riskFactors; }

    public List<MedicineInfoItem> getMedicines() { return medicines; }
    public void setMedicines(List<MedicineInfoItem> medicines) { this.medicines = medicines; }

    public List<WarningSignItem> getWarningSigns() { return warningSigns; }
    public void setWarningSigns(List<WarningSignItem> warningSigns) { this.warningSigns = warningSigns; }

    public List<Long> getRelatedDiseaseIds() { return relatedDiseaseIds; }
    public void setRelatedDiseaseIds(List<Long> relatedDiseaseIds) { this.relatedDiseaseIds = relatedDiseaseIds; }

    // Nested Item classes
    public static class SymptomItem {
        private String symptomEn;
        private String symptomBn;
        private Boolean isPrimary = false;

        public String getSymptomEn() { return symptomEn; }
        public void setSymptomEn(String symptomEn) { this.symptomEn = symptomEn; }
        public String getSymptomBn() { return symptomBn; }
        public void setSymptomBn(String symptomBn) { this.symptomBn = symptomBn; }
        public Boolean getIsPrimary() { return isPrimary; }
        public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }
    }

    public static class CauseItem {
        private String causeEn;
        private String causeBn;

        public String getCauseEn() { return causeEn; }
        public void setCauseEn(String causeEn) { this.causeEn = causeEn; }
        public String getCauseBn() { return causeBn; }
        public void setCauseBn(String causeBn) { this.causeBn = causeBn; }
    }

    public static class RiskFactorItem {
        private String factorEn;
        private String factorBn;

        public String getFactorEn() { return factorEn; }
        public void setFactorEn(String factorEn) { this.factorEn = factorEn; }
        public String getFactorBn() { return factorBn; }
        public void setFactorBn(String factorBn) { this.factorBn = factorBn; }
    }

    public static class MedicineInfoItem {
        private String nameEn;
        private String nameBn;
        private String drugClassEn;
        private String drugClassBn;
        private String generalInfoEn;
        private String generalInfoBn;
        private String disclaimerEn;
        private String disclaimerBn;

        public String getNameEn() { return nameEn; }
        public void setNameEn(String nameEn) { this.nameEn = nameEn; }
        public String getNameBn() { return nameBn; }
        public void setNameBn(String nameBn) { this.nameBn = nameBn; }
        public String getDrugClassEn() { return drugClassEn; }
        public void setDrugClassEn(String drugClassEn) { this.drugClassEn = drugClassEn; }
        public String getDrugClassBn() { return drugClassBn; }
        public void setDrugClassBn(String drugClassBn) { this.drugClassBn = drugClassBn; }
        public String getGeneralInfoEn() { return generalInfoEn; }
        public void setGeneralInfoEn(String generalInfoEn) { this.generalInfoEn = generalInfoEn; }
        public String getGeneralInfoBn() { return generalInfoBn; }
        public void setGeneralInfoBn(String generalInfoBn) { this.generalInfoBn = generalInfoBn; }
        public String getDisclaimerEn() { return disclaimerEn; }
        public void setDisclaimerEn(String disclaimerEn) { this.disclaimerEn = disclaimerEn; }
        public String getDisclaimerBn() { return disclaimerBn; }
        public void setDisclaimerBn(String disclaimerBn) { this.disclaimerBn = disclaimerBn; }
    }

    public static class WarningSignItem {
        private String signEn;
        private String signBn;
        private Boolean isEmergency = false;

        public String getSignEn() { return signEn; }
        public void setSignEn(String signEn) { this.signEn = signEn; }
        public String getSignBn() { return signBn; }
        public void setSignBn(String signBn) { this.signBn = signBn; }
        public Boolean getIsEmergency() { return isEmergency; }
        public void setIsEmergency(Boolean emergency) { isEmergency = emergency; }
    }
}
