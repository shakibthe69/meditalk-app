package com.meditalk.dto;

import jakarta.validation.constraints.NotNull;

public class DoctorStatusRequest {

    @NotNull(message = "Availability status is required")
    private Boolean isAvailable;

    public DoctorStatusRequest() {}

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
}
