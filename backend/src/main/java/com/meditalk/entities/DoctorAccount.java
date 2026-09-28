package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * A doctor's login account and professional profile.
 * Linked 1:1 to a {@link User} whose role is ROLE_DOCTOR.
 * This is separate from the patient-side {@link Doctor} directory entity.
 */
@Entity
@Table(name = "doctor_accounts")
public class DoctorAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(length = 60)
    private String licenseNumber;

    @Column(length = 150)
    private String hospitalOrClinic;

    @Column(length = 20)
    private String phoneNumber;

    @Column(length = 100)
    private String chamberAddress;

    @Column(length = 100)
    private String visitingHours;

    @Column(nullable = false)
    private Boolean isAvailable = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private LocalDateTime lastActiveAt;

    @PrePersist
    void onCreate() {
        if (lastActiveAt == null) {
            lastActiveAt = LocalDateTime.now();
        }
    }

    public DoctorAccount() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DoctorAccount account = new DoctorAccount();

        public Builder user(User user) { account.setUser(user); return this; }
        public Builder fullName(String fullName) { account.setFullName(fullName); return this; }
        public Builder specialization(String specialization) { account.setSpecialization(specialization); return this; }
        public Builder licenseNumber(String licenseNumber) { account.setLicenseNumber(licenseNumber); return this; }
        public Builder hospitalOrClinic(String hospitalOrClinic) { account.setHospitalOrClinic(hospitalOrClinic); return this; }
        public Builder phoneNumber(String phoneNumber) { account.setPhoneNumber(phoneNumber); return this; }
        public Builder chamberAddress(String chamberAddress) { account.setChamberAddress(chamberAddress); return this; }
        public Builder visitingHours(String visitingHours) { account.setVisitingHours(visitingHours); return this; }
        public Builder isAvailable(Boolean isAvailable) { account.setIsAvailable(isAvailable); return this; }
        public Builder lastActiveAt(LocalDateTime lastActiveAt) { account.setLastActiveAt(lastActiveAt); return this; }

        public DoctorAccount build() { return account; }
    }
}
