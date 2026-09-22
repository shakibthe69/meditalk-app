package com.meditalk.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DiseaseDetailDto {
    private Long id;
    private String nameEn;
    private String nameBn;
    private String slug;

    private Long categoryId;
    private String categoryNameEn;
    private String categoryNameBn;
    private String categoryIcon;

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

    private Boolean isPopular;
    private Integer viewCount;
    private String status;

    private String sourceName;
    private String sourceUrl;
    private String referenceNote;
    private LocalDate lastReviewedAt;

    private List<SymptomDto> symptoms = new ArrayList<>();
    private List<CauseDto> causes = new ArrayList<>();
    private List<RiskFactorDto> riskFactors = new ArrayList<>();
    private List<MedicineInfoDto> medicines = new ArrayList<>();
    private List<WarningSignDto> warningSigns = new ArrayList<>();
    private List<RelatedDiseaseDto> relatedDiseases = new ArrayList<>();

    public DiseaseDetailDto() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getNameBn() { return nameBn; }
    public void setNameBn(String nameBn) { this.nameBn = nameBn; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

    public String getCategoryNameEn() { return categoryNameEn; }
    public void setCategoryNameEn(String categoryNameEn) { this.categoryNameEn = categoryNameEn; }

    public String getCategoryNameBn() { return categoryNameBn; }
    public void setCategoryNameBn(String categoryNameBn) { this.categoryNameBn = categoryNameBn; }

    public String getCategoryIcon() { return categoryIcon; }
    public void setCategoryIcon(String categoryIcon) { this.categoryIcon = categoryIcon; }

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

    public Integer getViewCount() { return viewCount; }
    public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }

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

    public List<SymptomDto> getSymptoms() { return symptoms; }
    public void setSymptoms(List<SymptomDto> symptoms) { this.symptoms = symptoms; }

    public List<CauseDto> getCauses() { return causes; }
    public void setCauses(List<CauseDto> causes) { this.causes = causes; }

    public List<RiskFactorDto> getRiskFactors() { return riskFactors; }
    public void setRiskFactors(List<RiskFactorDto> riskFactors) { this.riskFactors = riskFactors; }

    public List<MedicineInfoDto> getMedicines() { return medicines; }
    public void setMedicines(List<MedicineInfoDto> medicines) { this.medicines = medicines; }

    public List<WarningSignDto> getWarningSigns() { return warningSigns; }
    public void setWarningSigns(List<WarningSignDto> warningSigns) { this.warningSigns = warningSigns; }

    public List<RelatedDiseaseDto> getRelatedDiseases() { return relatedDiseases; }
    public void setRelatedDiseases(List<RelatedDiseaseDto> relatedDiseases) { this.relatedDiseases = relatedDiseases; }

    // Nested DTOs
    public static class SymptomDto {
        private Long id;
        private String symptomEn;
        private String symptomBn;
        private Boolean isPrimary;

        public SymptomDto() {}
        public SymptomDto(Long id, String symptomEn, String symptomBn, Boolean isPrimary) {
            this.id = id;
            this.symptomEn = symptomEn;
            this.symptomBn = symptomBn;
            this.isPrimary = isPrimary;
        }

        public Long getId() { return id; }
        public String getSymptomEn() { return symptomEn; }
        public String getSymptomBn() { return symptomBn; }
        public Boolean getIsPrimary() { return isPrimary; }
    }

    public static class CauseDto {
        private Long id;
        private String causeEn;
        private String causeBn;

        public CauseDto() {}
        public CauseDto(Long id, String causeEn, String causeBn) {
            this.id = id;
            this.causeEn = causeEn;
            this.causeBn = causeBn;
        }

        public Long getId() { return id; }
        public String getCauseEn() { return causeEn; }
        public String getCauseBn() { return causeBn; }
    }

    public static class RiskFactorDto {
        private Long id;
        private String factorEn;
        private String factorBn;

        public RiskFactorDto() {}
        public RiskFactorDto(Long id, String factorEn, String factorBn) {
            this.id = id;
            this.factorEn = factorEn;
            this.factorBn = factorBn;
        }

        public Long getId() { return id; }
        public String getFactorEn() { return factorEn; }
        public String getFactorBn() { return factorBn; }
    }

    public static class MedicineInfoDto {
        private Long id;
        private String nameEn;
        private String nameBn;
        private String drugClassEn;
        private String drugClassBn;
        private String generalInfoEn;
        private String generalInfoBn;
        private String disclaimerEn;
        private String disclaimerBn;

        public MedicineInfoDto() {}
        public MedicineInfoDto(Long id, String nameEn, String nameBn, String drugClassEn, String drugClassBn,
                               String generalInfoEn, String generalInfoBn, String disclaimerEn, String disclaimerBn) {
            this.id = id;
            this.nameEn = nameEn;
            this.nameBn = nameBn;
            this.drugClassEn = drugClassEn;
            this.drugClassBn = drugClassBn;
            this.generalInfoEn = generalInfoEn;
            this.generalInfoBn = generalInfoBn;
            this.disclaimerEn = disclaimerEn;
            this.disclaimerBn = disclaimerBn;
        }

        public Long getId() { return id; }
        public String getNameEn() { return nameEn; }
        public String getNameBn() { return nameBn; }
        public String getDrugClassEn() { return drugClassEn; }
        public String getDrugClassBn() { return drugClassBn; }
        public String getGeneralInfoEn() { return generalInfoEn; }
        public String getGeneralInfoBn() { return generalInfoBn; }
        public String getDisclaimerEn() { return disclaimerEn; }
        public String getDisclaimerBn() { return disclaimerBn; }
    }

    public static class WarningSignDto {
        private Long id;
        private String signEn;
        private String signBn;
        private Boolean isEmergency;

        public WarningSignDto() {}
        public WarningSignDto(Long id, String signEn, String signBn, Boolean isEmergency) {
            this.id = id;
            this.signEn = signEn;
            this.signBn = signBn;
            this.isEmergency = isEmergency;
        }

        public Long getId() { return id; }
        public String getSignEn() { return signEn; }
        public String getSignBn() { return signBn; }
        public Boolean getIsEmergency() { return isEmergency; }
    }

    public static class RelatedDiseaseDto {
        private Long id;
        private String nameEn;
        private String nameBn;
        private String slug;

        public RelatedDiseaseDto() {}
        public RelatedDiseaseDto(Long id, String nameEn, String nameBn, String slug) {
            this.id = id;
            this.nameEn = nameEn;
            this.nameBn = nameBn;
            this.slug = slug;
        }

        public Long getId() { return id; }
        public String getNameEn() { return nameEn; }
        public String getNameBn() { return nameBn; }
        public String getSlug() { return slug; }
    }
}
