package com.meditalk.services;

import com.meditalk.dto.MedicalReportRequest;
import com.meditalk.dto.MedicalReportResponse;
import com.meditalk.entities.Doctor;
import com.meditalk.entities.MedicalReport;
import com.meditalk.entities.User;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.DoctorRepository;
import com.meditalk.repositories.MedicalReportRepository;
import com.meditalk.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicalReportService {

    private final MedicalReportRepository reportRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public MedicalReportService(MedicalReportRepository reportRepository,
                                DoctorRepository doctorRepository,
                                UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    public List<MedicalReportResponse> getReports(Long userId, String type) {
        List<MedicalReport> list = (type != null && !type.isBlank())
                ? reportRepository.findByUserIdAndTypeOrderByTestDateDesc(userId, type.toUpperCase())
                : reportRepository.findByUserIdOrderByTestDateDesc(userId);

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public MedicalReportResponse getReportById(Long id, Long userId) {
        MedicalReport report = reportRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        return mapToResponse(report);
    }

    @Transactional
    public MedicalReportResponse createReport(Long userId, MedicalReportRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Doctor doctor = null;
        if (request.getDoctorId() != null) {
            doctor = doctorRepository.findByIdAndUserId(request.getDoctorId(), userId).orElse(null);
        }

        MedicalReport report = MedicalReport.builder()
                .user(user)
                .doctor(doctor)
                .doctorName(request.getDoctorName() != null ? request.getDoctorName() : (doctor != null ? doctor.getName() : null))
                .title(request.getTitle())
                .type(request.getType().toUpperCase())
                .testDate(request.getTestDate())
                .hospitalOrLab(request.getHospitalOrLab())
                .notes(request.getNotes())
                .fileUrl(request.getFileUrl())
                .fileType(request.getFileType() != null ? request.getFileType().toUpperCase() : "IMAGE")
                .fileName(request.getFileName())
                .fileSizeBytes(request.getFileSizeBytes())
                .build();

        MedicalReport saved = reportRepository.save(report);
        return mapToResponse(saved);
    }

    @Transactional
    public MedicalReportResponse updateReport(Long id, Long userId, MedicalReportRequest request) {
        MedicalReport report = reportRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));

        report.setTitle(request.getTitle());
        report.setType(request.getType().toUpperCase());
        report.setTestDate(request.getTestDate());
        report.setHospitalOrLab(request.getHospitalOrLab());
        report.setNotes(request.getNotes());
        if (request.getFileUrl() != null) report.setFileUrl(request.getFileUrl());
        if (request.getFileType() != null) report.setFileType(request.getFileType().toUpperCase());
        if (request.getFileName() != null) report.setFileName(request.getFileName());
        if (request.getDoctorName() != null) report.setDoctorName(request.getDoctorName());

        MedicalReport updated = reportRepository.save(report);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteReport(Long id, Long userId) {
        MedicalReport report = reportRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        reportRepository.delete(report);
    }

    public MedicalReportResponse mapToResponse(MedicalReport r) {
        return MedicalReportResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .doctorId(r.getDoctor() != null ? r.getDoctor().getId() : null)
                .doctorName(r.getDoctorName())
                .title(r.getTitle())
                .type(r.getType())
                .testDate(r.getTestDate())
                .hospitalOrLab(r.getHospitalOrLab())
                .notes(r.getNotes())
                .fileUrl(r.getFileUrl())
                .fileType(r.getFileType())
                .fileName(r.getFileName())
                .fileSizeBytes(r.getFileSizeBytes())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
