package com.meditalk.dto;

/**
 * Doctor-editable professional profile fields.
 *
 * <p>Null means "leave unchanged", so the client can send a partial payload.
 * Email and account role are deliberately excluded — neither is doctor-editable.
 */
public class DoctorProfileUpdateRequest {

    private String fullName;
    private String specialization;
    private String licenseNumber;
    private String hospitalOrClinic;
    private String phoneNumber;
    private String chamberAddress;
    private String visitingHours;

    public DoctorProfileUpdateRequest() {}

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
}
