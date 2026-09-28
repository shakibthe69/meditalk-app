package com.meditalk.dto;

import jakarta.validation.constraints.NotBlank;

public class DoctorMessageRequest {

    /** Required when a doctor sends a message; ignored when a patient sends one. */
    private Long patientId;

    /** Required when a patient sends a message to a doctor account. */
    private Long doctorAccountId;

    @NotBlank(message = "Message body is required")
    private String body;

    public DoctorMessageRequest() {}

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getDoctorAccountId() { return doctorAccountId; }
    public void setDoctorAccountId(Long doctorAccountId) { this.doctorAccountId = doctorAccountId; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
}
