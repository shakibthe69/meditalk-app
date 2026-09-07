package com.meditalk.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "medicine_schedules")
public class MedicineSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    @Column(nullable = false, length = 20)
    private String time;

    @Column(nullable = false, length = 30)
    private String label = "MORNING";

    @Column(nullable = false, length = 50)
    private String dosageAmount;

    @Column(length = 30)
    private String foodInstruction;

    @Column(nullable = false)
    private Boolean isEnabled = true;

    public MedicineSchedule() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getDosageAmount() { return dosageAmount; }
    public void setDosageAmount(String dosageAmount) { this.dosageAmount = dosageAmount; }

    public String getFoodInstruction() { return foodInstruction; }
    public void setFoodInstruction(String foodInstruction) { this.foodInstruction = foodInstruction; }

    public Boolean getIsEnabled() { return isEnabled; }
    public void setIsEnabled(Boolean isEnabled) { this.isEnabled = isEnabled; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MedicineSchedule s = new MedicineSchedule();

        public Builder id(Long id) { s.setId(id); return this; }
        public Builder medicine(Medicine m) { s.setMedicine(m); return this; }
        public Builder time(String time) { s.setTime(time); return this; }
        public Builder label(String label) { s.setLabel(label); return this; }
        public Builder dosageAmount(String dosageAmount) { s.setDosageAmount(dosageAmount); return this; }
        public Builder foodInstruction(String foodInstruction) { s.setFoodInstruction(foodInstruction); return this; }
        public Builder isEnabled(Boolean isEnabled) { s.setIsEnabled(isEnabled); return this; }

        public MedicineSchedule build() { return s; }
    }
}
