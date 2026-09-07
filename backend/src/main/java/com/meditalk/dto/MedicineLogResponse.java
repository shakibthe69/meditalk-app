package com.meditalk.dto;

import java.time.LocalDateTime;

public class MedicineLogResponse {
    private Long id;
    private Long medicineId;
    private Long scheduleId;
    private String medicineName;
    private String dose;
    private String scheduledTime;
    private String takenTime;
    private String status;
    private String foodInstruction;
    private String notes;
    private LocalDateTime logDate;

    public MedicineLogResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMedicineId() { return medicineId; }
    public void setMedicineId(Long medicineId) { this.medicineId = medicineId; }

    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }

    public String getMedicineName() { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getDose() { return dose; }
    public void setDose(String dose) { this.dose = dose; }

    public String getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }

    public String getTakenTime() { return takenTime; }
    public void setTakenTime(String takenTime) { this.takenTime = takenTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFoodInstruction() { return foodInstruction; }
    public void setFoodInstruction(String foodInstruction) { this.foodInstruction = foodInstruction; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getLogDate() { return logDate; }
    public void setLogDate(LocalDateTime logDate) { this.logDate = logDate; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final MedicineLogResponse res = new MedicineLogResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder medicineId(Long medicineId) { res.setMedicineId(medicineId); return this; }
        public Builder scheduleId(Long scheduleId) { res.setScheduleId(scheduleId); return this; }
        public Builder medicineName(String medicineName) { res.setMedicineName(medicineName); return this; }
        public Builder dose(String dose) { res.setDose(dose); return this; }
        public Builder scheduledTime(String scheduledTime) { res.setScheduledTime(scheduledTime); return this; }
        public Builder takenTime(String takenTime) { res.setTakenTime(takenTime); return this; }
        public Builder status(String status) { res.setStatus(status); return this; }
        public Builder foodInstruction(String foodInstruction) { res.setFoodInstruction(foodInstruction); return this; }
        public Builder notes(String notes) { res.setNotes(notes); return this; }
        public Builder logDate(LocalDateTime logDate) { res.setLogDate(logDate); return this; }

        public MedicineLogResponse build() { return res; }
    }
}
