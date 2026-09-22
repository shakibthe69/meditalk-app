package com.meditalk.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "disease_warning_signs")
public class DiseaseWarningSign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id", nullable = false)
    private Disease disease;

    @Column(nullable = false, length = 350)
    private String signEn;

    @Column(nullable = false, length = 350)
    private String signBn;

    @Column(nullable = false)
    private Boolean isEmergency = false;

    private Integer displayOrder = 0;

    public DiseaseWarningSign() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Disease getDisease() { return disease; }
    public void setDisease(Disease disease) { this.disease = disease; }

    public String getSignEn() { return signEn; }
    public void setSignEn(String signEn) { this.signEn = signEn; }

    public String getSignBn() { return signBn; }
    public void setSignBn(String signBn) { this.signBn = signBn; }

    public Boolean getIsEmergency() { return isEmergency; }
    public void setIsEmergency(Boolean isEmergency) { this.isEmergency = isEmergency; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DiseaseWarningSign w = new DiseaseWarningSign();

        public Builder id(Long id) { w.setId(id); return this; }
        public Builder disease(Disease disease) { w.setDisease(disease); return this; }
        public Builder signEn(String signEn) { w.setSignEn(signEn); return this; }
        public Builder signBn(String signBn) { w.setSignBn(signBn); return this; }
        public Builder isEmergency(Boolean isEmergency) { w.setIsEmergency(isEmergency); return this; }
        public Builder displayOrder(Integer displayOrder) { w.setDisplayOrder(displayOrder); return this; }

        public DiseaseWarningSign build() { return w; }
    }
}
