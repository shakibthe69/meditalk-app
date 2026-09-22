package com.meditalk.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "disease_medicines")
public class DiseaseMedicineInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id", nullable = false)
    private Disease disease;

    @Column(nullable = false, length = 150)
    private String nameEn;

    @Column(nullable = false, length = 150)
    private String nameBn;

    @Column(length = 150)
    private String drugClassEn;

    @Column(length = 150)
    private String drugClassBn;

    @Column(columnDefinition = "TEXT")
    private String generalInfoEn;

    @Column(columnDefinition = "TEXT")
    private String generalInfoBn;

    @Column(length = 300)
    private String disclaimerEn = "For general educational information only. Never take prescription medication without a doctor's advice.";

    @Column(length = 300)
    private String disclaimerBn = "শুধুমাত্র সাধারণ স্বাস্থ্য শিক্ষার উদ্দেশ্যে। চিকিৎসকের পরামর্শ ব্যতীত কখনোই প্রেসক্রিপশন ওষুধ সেবন করবেন না।";

    private Integer displayOrder = 0;

    public DiseaseMedicineInfo() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Disease getDisease() { return disease; }
    public void setDisease(Disease disease) { this.disease = disease; }

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

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DiseaseMedicineInfo m = new DiseaseMedicineInfo();

        public Builder id(Long id) { m.setId(id); return this; }
        public Builder disease(Disease disease) { m.setDisease(disease); return this; }
        public Builder nameEn(String nameEn) { m.setNameEn(nameEn); return this; }
        public Builder nameBn(String nameBn) { m.setNameBn(nameBn); return this; }
        public Builder drugClassEn(String drugClassEn) { m.setDrugClassEn(drugClassEn); return this; }
        public Builder drugClassBn(String drugClassBn) { m.setDrugClassBn(drugClassBn); return this; }
        public Builder generalInfoEn(String generalInfoEn) { m.setGeneralInfoEn(generalInfoEn); return this; }
        public Builder generalInfoBn(String generalInfoBn) { m.setGeneralInfoBn(generalInfoBn); return this; }
        public Builder disclaimerEn(String disclaimerEn) { m.setDisclaimerEn(disclaimerEn); return this; }
        public Builder disclaimerBn(String disclaimerBn) { m.setDisclaimerBn(disclaimerBn); return this; }
        public Builder displayOrder(Integer displayOrder) { m.setDisplayOrder(displayOrder); return this; }

        public DiseaseMedicineInfo build() { return m; }
    }
}
