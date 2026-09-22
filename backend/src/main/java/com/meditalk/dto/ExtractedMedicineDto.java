package com.meditalk.dto;

import java.util.ArrayList;
import java.util.List;

public class ExtractedMedicineDto {
    private String name;
    private String genericName;
    private String dose;
    private String form;
    private String frequency;
    private List<String> timing = new ArrayList<>();
    private String foodInstruction;
    private String duration;
    private Integer durationDays;
    private String dosePattern;
    private boolean isUncertain = false;
    private List<MedicineScheduleDto> schedules = new ArrayList<>();
    private double confidenceScore = 0.95;

    public ExtractedMedicineDto() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getDose() { return dose; }
    public void setDose(String dose) { this.dose = dose; }

    public String getDosePattern() { return dosePattern; }
    public void setDosePattern(String dosePattern) { this.dosePattern = dosePattern; }

    public String getForm() { return form; }
    public void setForm(String form) { this.form = form; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public List<String> getTiming() { return timing; }
    public void setTiming(List<String> timing) { this.timing = timing; }

    public String getFoodInstruction() { return foodInstruction; }
    public void setFoodInstruction(String foodInstruction) { this.foodInstruction = foodInstruction; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }

    public boolean isUncertain() { return isUncertain; }
    public void setUncertain(boolean uncertain) { isUncertain = uncertain; }

    public List<MedicineScheduleDto> getSchedules() { return schedules; }
    public void setSchedules(List<MedicineScheduleDto> schedules) { this.schedules = schedules; }

    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final ExtractedMedicineDto dto = new ExtractedMedicineDto();

        public Builder name(String name) { dto.setName(name); return this; }
        public Builder genericName(String genericName) { dto.setGenericName(genericName); return this; }
        public Builder dose(String dose) { dto.setDose(dose); return this; }
        public Builder dosePattern(String dosePattern) { dto.setDosePattern(dosePattern); return this; }
        public Builder form(String form) { dto.setForm(form); return this; }
        public Builder frequency(String frequency) { dto.setFrequency(frequency); return this; }
        public Builder timing(List<String> timing) { dto.setTiming(timing); return this; }
        public Builder foodInstruction(String foodInstruction) { dto.setFoodInstruction(foodInstruction); return this; }
        public Builder duration(String duration) { dto.setDuration(duration); return this; }
        public Builder durationDays(Integer durationDays) { dto.setDurationDays(durationDays); return this; }
        public Builder isUncertain(boolean isUncertain) { dto.setUncertain(isUncertain); return this; }
        public Builder schedules(List<MedicineScheduleDto> schedules) { dto.setSchedules(schedules); return this; }
        public Builder confidenceScore(double confidenceScore) { dto.setConfidenceScore(confidenceScore); return this; }

        public ExtractedMedicineDto build() { return dto; }
    }
}
