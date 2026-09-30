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
    private final FileStorageService fileStorageService;

    public MedicalReportService(MedicalReportRepository reportRepository,
                                DoctorRepository doctorRepository,
                                UserRepository userRepository,
                                FileStorageService fileStorageService) {
        this.reportRepository = reportRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
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

        String fileUrl = normalizeFileUrl(request.getFileUrl());

        MedicalReport report = MedicalReport.builder()
                .user(user)
                .doctor(doctor)
                .doctorName(request.getDoctorName() != null ? request.getDoctorName() : (doctor != null ? doctor.getName() : null))
                .title(request.getTitle())
                .type(request.getType() != null ? request.getType().toUpperCase() : "GENERAL")
                .testDate(request.getTestDate() != null ? request.getTestDate() : java.time.LocalDate.now())
                .hospitalOrLab(request.getHospitalOrLab())
                .notes(request.getNotes())
                .fileUrl(fileUrl)
                .fileType(request.getFileType() != null ? request.getFileType().toUpperCase() : "NONE")
                .fileName(normalizeFileName(request.getFileName()))
                .fileSizeBytes(request.getFileSizeBytes())
                // Persist the uploaded bytes exactly as received (no re-encoding).
                .fileData(fileStorageService.readBytesByUrl(fileUrl))
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
        if (request.getFileUrl() != null) {
            String fileUrl = normalizeFileUrl(request.getFileUrl());
            report.setFileUrl(fileUrl);
            byte[] stored = fileStorageService.readBytesByUrl(fileUrl);
            report.setFileData(stored != null ? stored : null);
        }
        if (request.getFileType() != null) report.setFileType(request.getFileType().toUpperCase());
        if (request.getFileName() != null) report.setFileName(request.getFileName());
        if (request.getDoctorName() != null) report.setDoctorName(request.getDoctorName());

        MedicalReport updated = reportRepository.save(report);
        return mapToResponse(updated);
    }

    /**
     * Raw stored image bytes for a report. Backs the image-download endpoint and
     * the PDF generator so a report image survives even without the uploads folder.
     */
    public byte[] getReportFile(Long id, Long userId) {
        MedicalReport report = reportRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        return report.getFileData();
    }

    @Transactional
    public void deleteReport(Long id, Long userId) {
        MedicalReport report = reportRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with id: " + id));
        reportRepository.delete(report);
    }

    /**
     * Reports are often recorded by hand with no attachment. The column is NOT NULL, so
     * an absent file is stored as an empty URL — never as a link to an unrelated image.
     */
    private static String normalizeFileUrl(String fileUrl) {
        return fileUrl == null ? "" : fileUrl.trim();
    }

    /** The file name column is also NOT NULL; an unattached report stores an empty name. */
    private static String normalizeFileName(String fileName) {
        return fileName == null ? "" : fileName.trim();
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
