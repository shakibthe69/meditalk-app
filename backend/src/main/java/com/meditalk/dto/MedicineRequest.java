package com.meditalk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MedicineRequest {
    private Long prescriptionId;

    @NotBlank(message = "Medicine name is required")
    private String name;

    private String genericName;

    /**
     * Strength/dose as printed on the prescription. Intentionally optional: when the
     * prescription does not state it (or OCR could not read it) the value stays empty
     * rather than being invented, and the medicine is still saved.
     */
    private String dose;

    private String form = "TABLET";
    private String frequency = "ONCE_DAILY";
    private String foodInstruction = "AFTER_MEAL";

    private LocalDate startDate;


    private LocalDate endDate;
    private Integer durationDays;
    private String instructions;
    private Boolean isActive = true;
    private List<MedicineScheduleDto> schedules = new ArrayList<>();

    public MedicineRequest() {}

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

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MedicineRequest req = new MedicineRequest();

        public Builder prescriptionId(Long id) { req.setPrescriptionId(id); return this; }
        public Builder name(String name) { req.setName(name); return this; }
        public Builder genericName(String genericName) { req.setGenericName(genericName); return this; }
        public Builder dose(String dose) { req.setDose(dose); return this; }
        public Builder form(String form) { req.setForm(form); return this; }
        public Builder frequency(String frequency) { req.setFrequency(frequency); return this; }
        public Builder foodInstruction(String foodInstruction) { req.setFoodInstruction(foodInstruction); return this; }
        public Builder startDate(LocalDate startDate) { req.setStartDate(startDate); return this; }
        public Builder endDate(LocalDate endDate) { req.setEndDate(endDate); return this; }
        public Builder durationDays(Integer durationDays) { req.setDurationDays(durationDays); return this; }
        public Builder instructions(String instructions) { req.setInstructions(instructions); return this; }
        public Builder isActive(Boolean isActive) { req.setIsActive(isActive); return this; }
        public Builder schedules(List<MedicineScheduleDto> schedules) { req.setSchedules(schedules); return this; }

        public MedicineRequest build() { return req; }
    }
}
