package com.meditalk.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class MedicineResponse {
    private Long id;
    private Long userId;
    private Long prescriptionId;
    private String name;
    private String genericName;
    private String dose;
    private String form;
    private String frequency;
    private String foodInstruction;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationDays;
    private String instructions;
    private Boolean isActive;
    private List<MedicineScheduleDto> schedules = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public MedicineResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }

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

    public List<MedicineScheduleDto> getSchedules() { return schedules; }
    public void setSchedules(List<MedicineScheduleDto> schedules) { this.schedules = schedules; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MedicineResponse res = new MedicineResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder userId(Long userId) { res.setUserId(userId); return this; }
        public Builder prescriptionId(Long prescriptionId) { res.setPrescriptionId(prescriptionId); return this; }
        public Builder name(String name) { res.setName(name); return this; }
        public Builder genericName(String genericName) { res.setGenericName(genericName); return this; }
        public Builder dose(String dose) { res.setDose(dose); return this; }
        public Builder form(String form) { res.setForm(form); return this; }
        public Builder frequency(String frequency) { res.setFrequency(frequency); return this; }
        public Builder foodInstruction(String foodInstruction) { res.setFoodInstruction(foodInstruction); return this; }
        public Builder startDate(LocalDate startDate) { res.setStartDate(startDate); return this; }
        public Builder endDate(LocalDate endDate) { res.setEndDate(endDate); return this; }
        public Builder durationDays(Integer durationDays) { res.setDurationDays(durationDays); return this; }
        public Builder instructions(String instructions) { res.setInstructions(instructions); return this; }
        public Builder isActive(Boolean isActive) { res.setIsActive(isActive); return this; }
        public Builder schedules(List<MedicineScheduleDto> schedules) { res.setSchedules(schedules); return this; }
        public Builder createdAt(LocalDateTime createdAt) { res.setCreatedAt(createdAt); return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { res.setUpdatedAt(updatedAt); return this; }

        public MedicineResponse build() { return res; }
    }
}
