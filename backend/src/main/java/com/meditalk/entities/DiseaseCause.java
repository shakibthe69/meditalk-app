package com.meditalk.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "disease_causes")
public class DiseaseCause {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id", nullable = false)
    private Disease disease;

    @Column(nullable = false, length = 300)
    private String causeEn;

    @Column(nullable = false, length = 300)
    private String causeBn;

    private Integer displayOrder = 0;

    public DiseaseCause() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Disease getDisease() { return disease; }
    public void setDisease(Disease disease) { this.disease = disease; }

    public String getCauseEn() { return causeEn; }
    public void setCauseEn(String causeEn) { this.causeEn = causeEn; }

    public String getCauseBn() { return causeBn; }
    public void setCauseBn(String causeBn) { this.causeBn = causeBn; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DiseaseCause c = new DiseaseCause();

        public Builder id(Long id) { c.setId(id); return this; }
        public Builder disease(Disease disease) { c.setDisease(disease); return this; }
        public Builder causeEn(String causeEn) { c.setCauseEn(causeEn); return this; }
        public Builder causeBn(String causeBn) { c.setCauseBn(causeBn); return this; }
        public Builder displayOrder(Integer displayOrder) { c.setDisplayOrder(displayOrder); return this; }

        public DiseaseCause build() { return c; }
    }
}
