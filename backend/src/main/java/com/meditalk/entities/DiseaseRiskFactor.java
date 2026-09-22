package com.meditalk.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "disease_risk_factors")
public class DiseaseRiskFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id", nullable = false)
    private Disease disease;

    @Column(nullable = false, length = 300)
    private String factorEn;

    @Column(nullable = false, length = 300)
    private String factorBn;

    private Integer displayOrder = 0;

    public DiseaseRiskFactor() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Disease getDisease() { return disease; }
    public void setDisease(Disease disease) { this.disease = disease; }

    public String getFactorEn() { return factorEn; }
    public void setFactorEn(String factorEn) { this.factorEn = factorEn; }

    public String getFactorBn() { return factorBn; }
    public void setFactorBn(String factorBn) { this.factorBn = factorBn; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DiseaseRiskFactor f = new DiseaseRiskFactor();

        public Builder id(Long id) { f.setId(id); return this; }
        public Builder disease(Disease disease) { f.setDisease(disease); return this; }
        public Builder factorEn(String factorEn) { f.setFactorEn(factorEn); return this; }
        public Builder factorBn(String factorBn) { f.setFactorBn(factorBn); return this; }
        public Builder displayOrder(Integer displayOrder) { f.setDisplayOrder(displayOrder); return this; }

        public DiseaseRiskFactor build() { return f; }
    }
}
