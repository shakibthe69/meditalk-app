package com.meditalk.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * A curated hospital directory entry used by the emergency assistance feature.
 * Nearby hospitals are resolved on the device via GPS + OpenStreetMap;
 * this table powers the fallback list and national emergency numbers context.
 */
@Entity
@Table(name = "hospitals")
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(length = 30)
    private String phone;

    @Column(length = 30)
    private String emergencyPhone;

    private Double latitude;

    private Double longitude;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Hospital() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmergencyPhone() { return emergencyPhone; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final Hospital hospital = new Hospital();

        public Builder name(String name) { hospital.setName(name); return this; }
        public Builder address(String address) { hospital.setAddress(address); return this; }
        public Builder phone(String phone) { hospital.setPhone(phone); return this; }
        public Builder emergencyPhone(String emergencyPhone) { hospital.setEmergencyPhone(emergencyPhone); return this; }
        public Builder latitude(Double latitude) { hospital.setLatitude(latitude); return this; }
        public Builder longitude(Double longitude) { hospital.setLongitude(longitude); return this; }

        public Hospital build() { return hospital; }
    }
}
