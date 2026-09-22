package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "diseases", indexes = {
        @Index(name = "idx_disease_slug", columnList = "slug"),
        @Index(name = "idx_disease_status", columnList = "status"),
        @Index(name = "idx_disease_popular", columnList = "isPopular")
})
public class Disease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nameEn;

    @Column(nullable = false, length = 180)
    private String nameBn;

    @Column(nullable = false, unique = true, length = 150)
    private String slug;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private DiseaseCategory category;

    @Column(length = 150)
    private String subcategoryEn;

    @Column(length = 150)
    private String subcategoryBn;

    @Column(columnDefinition = "TEXT")
    private String alternativeNamesEn;

    @Column(columnDefinition = "TEXT")
    private String alternativeNamesBn;

    @Column(columnDefinition = "LONGTEXT")
    private String overviewEn;

    @Column(columnDefinition = "LONGTEXT")
    private String overviewBn;

    @Column(columnDefinition = "LONGTEXT")
    private String diagnosisEn;

    @Column(columnDefinition = "LONGTEXT")
    private String diagnosisBn;

    @Column(columnDefinition = "LONGTEXT")
    private String treatmentOverviewEn;

    @Column(columnDefinition = "LONGTEXT")
    private String treatmentOverviewBn;

    @Column(columnDefinition = "LONGTEXT")
    private String homeCareEn;

    @Column(columnDefinition = "LONGTEXT")
    private String homeCareBn;

    @Column(columnDefinition = "LONGTEXT")
    private String dietLifestyleEn;

    @Column(columnDefinition = "LONGTEXT")
    private String dietLifestyleBn;

    @Column(columnDefinition = "LONGTEXT")
    private String preventionEn;

    @Column(columnDefinition = "LONGTEXT")
    private String preventionBn;

    @Column(columnDefinition = "LONGTEXT")
    private String doctorVisitEn;

    @Column(columnDefinition = "LONGTEXT")
    private String doctorVisitBn;

    @Column(columnDefinition = "LONGTEXT")
    private String emergencyEn;

    @Column(columnDefinition = "LONGTEXT")
    private String emergencyBn;

    @Column(length = 150)
    private String durationEn;

    @Column(length = 150)
    private String durationBn;

    @Column(nullable = false)
    private Boolean isPopular = false;

    @Column(nullable = false)
    private Integer viewCount = 0;

    @Column(nullable = false, length = 30)
    private String status = "PUBLISHED"; // PUBLISHED, DRAFT, REVIEW, ARCHIVED

    @Column(length = 200)
    private String sourceName;

    @Column(length = 400)
    private String sourceUrl;

    @Column(length = 400)
    private String referenceNote;

    private LocalDate lastReviewedAt;

    @OneToMany(mappedBy = "disease", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DiseaseSymptom> symptoms = new ArrayList<>();

    @OneToMany(mappedBy = "disease", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DiseaseCause> causes = new ArrayList<>();

    @OneToMany(mappedBy = "disease", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DiseaseRiskFactor> riskFactors = new ArrayList<>();

    @OneToMany(mappedBy = "disease", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DiseaseMedicineInfo> medicines = new ArrayList<>();

    @OneToMany(mappedBy = "disease", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<DiseaseWarningSign> warningSigns = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "disease_related",
            joinColumns = @JoinColumn(name = "disease_id"),
            inverseJoinColumns = @JoinColumn(name = "related_disease_id")
    )
    private List<Disease> relatedDiseases = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Disease() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getNameBn() { return nameBn; }
    public void setNameBn(String nameBn) { this.nameBn = nameBn; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public DiseaseCategory getCategory() { return category; }
    public void setCategory(DiseaseCategory category) { this.category = category; }

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
    public void setIsPopular(Boolean isPopular) { this.isPopular = isPopular; }

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

    public List<DiseaseSymptom> getSymptoms() { return symptoms; }
    public void setSymptoms(List<DiseaseSymptom> symptoms) { this.symptoms = symptoms; }

    public List<DiseaseCause> getCauses() { return causes; }
    public void setCauses(List<DiseaseCause> causes) { this.causes = causes; }

    public List<DiseaseRiskFactor> getRiskFactors() { return riskFactors; }
    public void setRiskFactors(List<DiseaseRiskFactor> riskFactors) { this.riskFactors = riskFactors; }

    public List<DiseaseMedicineInfo> getMedicines() { return medicines; }
    public void setMedicines(List<DiseaseMedicineInfo> medicines) { this.medicines = medicines; }

    public List<DiseaseWarningSign> getWarningSigns() { return warningSigns; }
    public void setWarningSigns(List<DiseaseWarningSign> warningSigns) { this.warningSigns = warningSigns; }

    public List<Disease> getRelatedDiseases() { return relatedDiseases; }
    public void setRelatedDiseases(List<Disease> relatedDiseases) { this.relatedDiseases = relatedDiseases; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final Disease d = new Disease();

        public Builder id(Long id) { d.setId(id); return this; }
        public Builder nameEn(String nameEn) { d.setNameEn(nameEn); return this; }
        public Builder nameBn(String nameBn) { d.setNameBn(nameBn); return this; }
        public Builder slug(String slug) { d.setSlug(slug); return this; }
        public Builder category(DiseaseCategory category) { d.setCategory(category); return this; }
        public Builder subcategoryEn(String subcategoryEn) { d.setSubcategoryEn(subcategoryEn); return this; }
        public Builder subcategoryBn(String subcategoryBn) { d.setSubcategoryBn(subcategoryBn); return this; }
        public Builder alternativeNamesEn(String alt) { d.setAlternativeNamesEn(alt); return this; }
        public Builder alternativeNamesBn(String alt) { d.setAlternativeNamesBn(alt); return this; }
        public Builder overviewEn(String overviewEn) { d.setOverviewEn(overviewEn); return this; }
        public Builder overviewBn(String overviewBn) { d.setOverviewBn(overviewBn); return this; }
        public Builder diagnosisEn(String diag) { d.setDiagnosisEn(diag); return this; }
        public Builder diagnosisBn(String diag) { d.setDiagnosisBn(diag); return this; }
        public Builder treatmentOverviewEn(String treat) { d.setTreatmentOverviewEn(treat); return this; }
        public Builder treatmentOverviewBn(String treat) { d.setTreatmentOverviewBn(treat); return this; }
        public Builder homeCareEn(String home) { d.setHomeCareEn(home); return this; }
        public Builder homeCareBn(String home) { d.setHomeCareBn(home); return this; }
        public Builder dietLifestyleEn(String diet) { d.setDietLifestyleEn(diet); return this; }
        public Builder dietLifestyleBn(String diet) { d.setDietLifestyleBn(diet); return this; }
        public Builder preventionEn(String prev) { d.setPreventionEn(prev); return this; }
        public Builder preventionBn(String prev) { d.setPreventionBn(prev); return this; }
        public Builder doctorVisitEn(String doc) { d.setDoctorVisitEn(doc); return this; }
        public Builder doctorVisitBn(String doc) { d.setDoctorVisitBn(doc); return this; }
        public Builder emergencyEn(String em) { d.setEmergencyEn(em); return this; }
        public Builder emergencyBn(String em) { d.setEmergencyBn(em); return this; }
        public Builder durationEn(String dur) { d.setDurationEn(dur); return this; }
        public Builder durationBn(String dur) { d.setDurationBn(dur); return this; }
        public Builder isPopular(Boolean isPopular) { d.setIsPopular(isPopular); return this; }
        public Builder viewCount(Integer count) { d.setViewCount(count); return this; }
        public Builder status(String status) { d.setStatus(status); return this; }
        public Builder sourceName(String src) { d.setSourceName(src); return this; }
        public Builder sourceUrl(String url) { d.setSourceUrl(url); return this; }
        public Builder referenceNote(String note) { d.setReferenceNote(note); return this; }
        public Builder lastReviewedAt(LocalDate date) { d.setLastReviewedAt(date); return this; }

        public Disease build() { return d; }
    }
}
