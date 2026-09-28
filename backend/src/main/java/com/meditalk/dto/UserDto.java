package com.meditalk.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class UserDto {
    private Long id;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String dateOfBirth;
    private String bloodGroup;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private List<String> allergies = new ArrayList<>();
    private List<String> chronicConditions = new ArrayList<>();
    private String role;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastActiveAt;

    /**
     * Consent flag for automated medication follow-up calls (future AI voice).
     * Mirrors {@code User.followUpCallsOptIn}; surfaced so the profile screen can
     * show and toggle the preference explicitly — never enabled silently.
     */
    private Boolean followUpCallsOptIn = false;

    public UserDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }

    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) { this.allergies = allergies; }

    public List<String> getChronicConditions() { return chronicConditions; }
    public void setChronicConditions(List<String> chronicConditions) { this.chronicConditions = chronicConditions; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public Boolean getFollowUpCallsOptIn() { return followUpCallsOptIn; }
    public void setFollowUpCallsOptIn(Boolean followUpCallsOptIn) { this.followUpCallsOptIn = followUpCallsOptIn; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final UserDto dto = new UserDto();

        public Builder id(Long id) { dto.setId(id); return this; }
        public Builder email(String email) { dto.setEmail(email); return this; }
        public Builder fullName(String fullName) { dto.setFullName(fullName); return this; }
        public Builder phoneNumber(String phoneNumber) { dto.setPhoneNumber(phoneNumber); return this; }
        public Builder dateOfBirth(String dateOfBirth) { dto.setDateOfBirth(dateOfBirth); return this; }
        public Builder bloodGroup(String bloodGroup) { dto.setBloodGroup(bloodGroup); return this; }
        public Builder emergencyContactName(String emergencyContactName) { dto.setEmergencyContactName(emergencyContactName); return this; }
        public Builder emergencyContactPhone(String emergencyContactPhone) { dto.setEmergencyContactPhone(emergencyContactPhone); return this; }
        public Builder allergies(List<String> allergies) { dto.setAllergies(allergies); return this; }
        public Builder chronicConditions(List<String> chronicConditions) { dto.setChronicConditions(chronicConditions); return this; }
        public Builder role(String role) { dto.setRole(role); return this; }
        public Builder createdAt(LocalDateTime createdAt) { dto.setCreatedAt(createdAt); return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { dto.setUpdatedAt(updatedAt); return this; }
        public Builder lastActiveAt(LocalDateTime lastActiveAt) { dto.setLastActiveAt(lastActiveAt); return this; }
        public Builder followUpCallsOptIn(Boolean optIn) { dto.setFollowUpCallsOptIn(optIn); return this; }

        public UserDto build() { return dto; }
    }
}
