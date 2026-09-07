package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "medicine_logs")
public class MedicineLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicine_id", nullable = false)
    private Medicine medicine;

    private Long scheduleId;

    @Column(nullable = false, length = 150)
    private String medicineName;

    @Column(nullable = false, length = 50)
    private String dose;

    @Column(nullable = false, length = 30)
    private String scheduledTime;

    @Column(length = 30)
    private String takenTime;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(length = 30)
    private String foodInstruction;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime logDate;

    public MedicineLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Medicine getMedicine() { return medicine; }
    public void setMedicine(Medicine medicine) { this.medicine = medicine; }

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
        private final MedicineLog l = new MedicineLog();

        public Builder id(Long id) { l.setId(id); return this; }
        public Builder user(User user) { l.setUser(user); return this; }
        public Builder medicine(Medicine m) { l.setMedicine(m); return this; }
        public Builder scheduleId(Long scheduleId) { l.setScheduleId(scheduleId); return this; }
        public Builder medicineName(String medicineName) { l.setMedicineName(medicineName); return this; }
        public Builder dose(String dose) { l.setDose(dose); return this; }
        public Builder scheduledTime(String scheduledTime) { l.setScheduledTime(scheduledTime); return this; }
        public Builder takenTime(String takenTime) { l.setTakenTime(takenTime); return this; }
        public Builder status(String status) { l.setStatus(status); return this; }
        public Builder foodInstruction(String foodInstruction) { l.setFoodInstruction(foodInstruction); return this; }
        public Builder notes(String notes) { l.setNotes(notes); return this; }

        public MedicineLog build() { return l; }
    }
}
