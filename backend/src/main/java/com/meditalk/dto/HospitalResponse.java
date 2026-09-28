package com.meditalk.dto;

public class HospitalResponse {
    private Long id;
    private String name;
    private String address;
    private String phone;
    private String emergencyPhone;
    private Double latitude;
    private Double longitude;
    private Double distanceKm;

    public HospitalResponse() {}

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

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final HospitalResponse res = new HospitalResponse();

        public Builder id(Long id) { res.setId(id); return this; }
        public Builder name(String name) { res.setName(name); return this; }
        public Builder address(String address) { res.setAddress(address); return this; }
        public Builder phone(String phone) { res.setPhone(phone); return this; }
        public Builder emergencyPhone(String emergencyPhone) { res.setEmergencyPhone(emergencyPhone); return this; }
        public Builder latitude(Double latitude) { res.setLatitude(latitude); return this; }
        public Builder longitude(Double longitude) { res.setLongitude(longitude); return this; }
        public Builder distanceKm(Double distanceKm) { res.setDistanceKm(distanceKm); return this; }

        public HospitalResponse build() { return res; }
    }
}
