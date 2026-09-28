package com.meditalk.dto;

import java.time.LocalDateTime;

public class DoctorAccountResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String specialization;
    private String licenseNumber;
    private String hospitalOrClinic;
    private String phoneNumber;
    private String chamberAddress;
    private String visitingHours;
    private Boolean isAvailable;
    /** Live connection presence (WebSocket session open), distinct from the manual availability flag. */
    private Boolean isOnline = false;
    private LocalDateTime lastActiveAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DoctorAccountResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getHospitalOrClinic() { return hospitalOrClinic; }
    public void setHospitalOrClinic(String hospitalOrClinic) { this.hospitalOrClinic = hospitalOrClinic; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getChamberAddress() { return chamberAddress; }
    public void setChamberAddress(String chamberAddress) { this.chamberAddress = chamberAddress; }

    public String getVisitingHours() { return visitingHours; }
    public void setVisitingHours(String visitingHours) { this.visitingHours = visitingHours; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public Boolean getIsOnline() { return isOnline; }
    public void setIsOnline(Boolean isOnline) { this.isOnline = isOnline; }

    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DoctorAccountResponse res = new DoctorAccountResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder userId(Long userId) { res.setUserId(userId); return this; }
        public Builder fullName(String fullName) { res.setFullName(fullName); return this; }
        public Builder email(String email) { res.setEmail(email); return this; }
        public Builder specialization(String specialization) { res.setSpecialization(specialization); return this; }
        public Builder licenseNumber(String licenseNumber) { res.setLicenseNumber(licenseNumber); return this; }
        public Builder hospitalOrClinic(String hospitalOrClinic) { res.setHospitalOrClinic(hospitalOrClinic); return this; }
        public Builder phoneNumber(String phoneNumber) { res.setPhoneNumber(phoneNumber); return this; }
        public Builder chamberAddress(String chamberAddress) { res.setChamberAddress(chamberAddress); return this; }
        public Builder visitingHours(String visitingHours) { res.setVisitingHours(visitingHours); return this; }
        public Builder isAvailable(Boolean isAvailable) { res.setIsAvailable(isAvailable); return this; }
        public Builder isOnline(Boolean isOnline) { res.setIsOnline(isOnline); return this; }
        public Builder lastActiveAt(LocalDateTime lastActiveAt) { res.setLastActiveAt(lastActiveAt); return this; }
        public Builder createdAt(LocalDateTime createdAt) { res.setCreatedAt(createdAt); return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { res.setUpdatedAt(updatedAt); return this; }

        public DoctorAccountResponse build() { return res; }
    }
}
