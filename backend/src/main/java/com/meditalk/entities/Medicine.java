package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medicines")
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id")
    private Prescription prescription;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 150)
    private String genericName;

    @Column(nullable = false, length = 50)
    private String dose;

    @Column(length = 30)
    private String form = "TABLET";

    @Column(nullable = false, length = 30)
    private String frequency = "ONCE_DAILY";

    @Column(nullable = false, length = 30)
    private String foodInstruction = "AFTER_MEAL";

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    private Integer durationDays;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "medicine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicineSchedule> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "medicine", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicineLog> logs = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Medicine() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Prescription getPrescription() { return prescription; }
    public void setPrescription(Prescription prescription) { this.prescription = prescription; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getDose() { return dose; }
    public void setDose(String dose) { this.dose = dose; }

    public String getForm() { return form; }
    public void setForm(String form) { this.form = form; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getFoodInstruction() { return foodInstruction; }
    public void setFoodInstruction(String foodInstruction) { this.foodInstruction = foodInstruction; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<MedicineSchedule> getSchedules() { return schedules; }
    public void setSchedules(List<MedicineSchedule> schedules) { this.schedules = schedules; }

    public List<MedicineLog> getLogs() { return logs; }
    public void setLogs(List<MedicineLog> logs) { this.logs = logs; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final Medicine m = new Medicine();

        public Builder id(Long id) { m.setId(id); return this; }
        public Builder user(User user) { m.setUser(user); return this; }
        public Builder prescription(Prescription p) { m.setPrescription(p); return this; }
        public Builder name(String name) { m.setName(name); return this; }
        public Builder genericName(String genericName) { m.setGenericName(genericName); return this; }
        public Builder dose(String dose) { m.setDose(dose); return this; }
        public Builder form(String form) { m.setForm(form); return this; }
        public Builder frequency(String frequency) { m.setFrequency(frequency); return this; }
        public Builder foodInstruction(String foodInstruction) { m.setFoodInstruction(foodInstruction); return this; }
        public Builder startDate(LocalDate startDate) { m.setStartDate(startDate); return this; }
        public Builder endDate(LocalDate endDate) { m.setEndDate(endDate); return this; }
        public Builder durationDays(Integer durationDays) { m.setDurationDays(durationDays); return this; }
        public Builder instructions(String instructions) { m.setInstructions(instructions); return this; }
        public Builder isActive(Boolean isActive) { m.setIsActive(isActive); return this; }

        public Medicine build() { return m; }
    }
}
