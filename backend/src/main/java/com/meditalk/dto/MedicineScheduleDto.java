package com.meditalk.dto;

public class MedicineScheduleDto {
    private Long id;
    private String time;
    private String label;
    private String dosageAmount;
    private String foodInstruction;
    private Boolean isEnabled = true;

    public MedicineScheduleDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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
        private final MedicineScheduleDto dto = new MedicineScheduleDto();

        public Builder id(Long id) { dto.setId(id); return this; }
        public Builder time(String time) { dto.setTime(time); return this; }
        public Builder label(String label) { dto.setLabel(label); return this; }
        public Builder dosageAmount(String dosageAmount) { dto.setDosageAmount(dosageAmount); return this; }
        public Builder foodInstruction(String foodInstruction) { dto.setFoodInstruction(foodInstruction); return this; }
        public Builder isEnabled(Boolean isEnabled) { dto.setIsEnabled(isEnabled); return this; }

        public MedicineScheduleDto build() { return dto; }
    }
}
