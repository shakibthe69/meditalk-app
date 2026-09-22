package com.meditalk.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "disease_symptoms")
public class DiseaseSymptom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id", nullable = false)
    private Disease disease;

    @Column(nullable = false, length = 255)
    private String symptomEn;

    @Column(nullable = false, length = 255)
    private String symptomBn;

    @Column(nullable = false)
    private Boolean isPrimary = false;

    private Integer displayOrder = 0;

    public DiseaseSymptom() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Disease getDisease() { return disease; }
    public void setDisease(Disease disease) { this.disease = disease; }

    public String getSymptomEn() { return symptomEn; }
    public void setSymptomEn(String symptomEn) { this.symptomEn = symptomEn; }

    public String getSymptomBn() { return symptomBn; }
    public void setSymptomBn(String symptomBn) { this.symptomBn = symptomBn; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean isPrimary) { this.isPrimary = isPrimary; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DiseaseSymptom s = new DiseaseSymptom();

        public Builder id(Long id) { s.setId(id); return this; }
        public Builder disease(Disease disease) { s.setDisease(disease); return this; }
        public Builder symptomEn(String symptomEn) { s.setSymptomEn(symptomEn); return this; }
        public Builder symptomBn(String symptomBn) { s.setSymptomBn(symptomBn); return this; }
        public Builder isPrimary(Boolean isPrimary) { s.setIsPrimary(isPrimary); return this; }
        public Builder displayOrder(Integer displayOrder) { s.setDisplayOrder(displayOrder); return this; }

        public DiseaseSymptom build() { return s; }
    }
}
