package com.meditalk.services;

import com.meditalk.dto.DoctorRequest;
import com.meditalk.dto.DoctorResponse;
import com.meditalk.entities.Doctor;
import com.meditalk.entities.User;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.DoctorRepository;
import com.meditalk.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public DoctorService(DoctorRepository doctorRepository, UserRepository userRepository) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    public List<DoctorResponse> getDoctors(Long userId) {
        return doctorRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DoctorResponse getDoctorById(Long id, Long userId) {
        Doctor doctor = doctorRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        return mapToResponse(doctor);
    }

    @Transactional
    public DoctorResponse createDoctor(Long userId, DoctorRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Doctor doctor = Doctor.builder()
                .user(user)
                .name(request.getName())
                .specialization(request.getSpecialization())
                .hospitalOrClinic(request.getHospitalOrClinic())
                .phoneNumber(request.getPhoneNumber())
                .email(request.getEmail())
                .chamberAddress(request.getChamberAddress())
                .visitingHours(request.getVisitingHours())
                .notes(request.getNotes())
                .build();

        Doctor saved = doctorRepository.save(doctor);
        return mapToResponse(saved);
    }

    @Transactional
    public DoctorResponse updateDoctor(Long id, Long userId, DoctorRequest request) {
        Doctor doctor = doctorRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));

        doctor.setName(request.getName());
        doctor.setSpecialization(request.getSpecialization());
        doctor.setHospitalOrClinic(request.getHospitalOrClinic());
        doctor.setPhoneNumber(request.getPhoneNumber());
        doctor.setEmail(request.getEmail());
        doctor.setChamberAddress(request.getChamberAddress());
        doctor.setVisitingHours(request.getVisitingHours());
        doctor.setNotes(request.getNotes());

        Doctor updated = doctorRepository.save(doctor);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteDoctor(Long id, Long userId) {
        Doctor doctor = doctorRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
        doctorRepository.delete(doctor);
    }

    public DoctorResponse mapToResponse(Doctor doctor) {
        return DoctorResponse.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .specialization(doctor.getSpecialization())
                .hospitalOrClinic(doctor.getHospitalOrClinic())
                .phoneNumber(doctor.getPhoneNumber())
                .email(doctor.getEmail())
                .chamberAddress(doctor.getChamberAddress())
                .visitingHours(doctor.getVisitingHours())
                .notes(doctor.getNotes())
                .createdAt(doctor.getCreatedAt())
                .updatedAt(doctor.getUpdatedAt())
                .build();
    }
}
