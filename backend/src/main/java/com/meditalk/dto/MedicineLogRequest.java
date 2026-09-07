package com.meditalk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MedicineLogRequest {
    @NotNull(message = "Medicine ID is required")
    private Long medicineId;
    private Long scheduleId;
    private String medicineName;
    private String dose;
    private String scheduledTime;
    @NotBlank(message = "Status is required")
    private String status;
    private String takenTime;
    private String foodInstruction;
    private String notes;

    public MedicineLogRequest() {}

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTakenTime() { return takenTime; }
    public void setTakenTime(String takenTime) { this.takenTime = takenTime; }

    public String getFoodInstruction() { return foodInstruction; }
    public void setFoodInstruction(String foodInstruction) { this.foodInstruction = foodInstruction; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
