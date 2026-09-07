package com.meditalk.dto;

import java.time.LocalDateTime;

public class DoctorResponse {
    private Long id;
    private String name;
    private String specialization;
    private String hospitalOrClinic;
    private String phoneNumber;
    private String email;
    private String chamberAddress;
    private String visitingHours;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DoctorResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getHospitalOrClinic() { return hospitalOrClinic; }
    public void setHospitalOrClinic(String hospitalOrClinic) { this.hospitalOrClinic = hospitalOrClinic; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getChamberAddress() { return chamberAddress; }
    public void setChamberAddress(String chamberAddress) { this.chamberAddress = chamberAddress; }

    public String getVisitingHours() { return visitingHours; }
    public void setVisitingHours(String visitingHours) { this.visitingHours = visitingHours; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DoctorResponse res = new DoctorResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder name(String name) { res.setName(name); return this; }
        public Builder specialization(String specialization) { res.setSpecialization(specialization); return this; }
        public Builder hospitalOrClinic(String hospitalOrClinic) { res.setHospitalOrClinic(hospitalOrClinic); return this; }
        public Builder phoneNumber(String phoneNumber) { res.setPhoneNumber(phoneNumber); return this; }
        public Builder email(String email) { res.setEmail(email); return this; }
        public Builder chamberAddress(String chamberAddress) { res.setChamberAddress(chamberAddress); return this; }
        public Builder visitingHours(String visitingHours) { res.setVisitingHours(visitingHours); return this; }
        public Builder notes(String notes) { res.setNotes(notes); return this; }
        public Builder createdAt(LocalDateTime createdAt) { res.setCreatedAt(createdAt); return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { res.setUpdatedAt(updatedAt); return this; }

        public DoctorResponse build() { return res; }
    }
}
