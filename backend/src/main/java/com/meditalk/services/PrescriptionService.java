package com.meditalk.services;

import com.meditalk.dto.MedicineRequest;
import com.meditalk.dto.MedicineResponse;
import com.meditalk.dto.MedicineScheduleDto;
import com.meditalk.dto.PrescriptionRequest;
import com.meditalk.dto.PrescriptionResponse;
import com.meditalk.entities.Doctor;
import com.meditalk.entities.Medicine;
import com.meditalk.entities.MedicineSchedule;
import com.meditalk.entities.Prescription;
import com.meditalk.entities.User;
import com.meditalk.exceptions.DuplicatePrescriptionException;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.entities.MedicineLog;
import com.meditalk.repositories.DoctorRepository;
import com.meditalk.repositories.MedicineLogRepository;
import com.meditalk.repositories.MedicineRepository;
import com.meditalk.repositories.MedicineScheduleRepository;
import com.meditalk.repositories.PrescriptionRepository;
import com.meditalk.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineScheduleRepository scheduleRepository;
    private final MedicineService medicineService;
    private final MedicineLogRepository medicineLogRepository;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
                               DoctorRepository doctorRepository,
                               UserRepository userRepository,
                               MedicineRepository medicineRepository,
                               MedicineScheduleRepository scheduleRepository,
                               MedicineService medicineService,
                               MedicineLogRepository medicineLogRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
        this.scheduleRepository = scheduleRepository;
        this.medicineService = medicineService;
        this.medicineLogRepository = medicineLogRepository;
    }

    public List<PrescriptionResponse> getPrescriptions(Long userId) {
        return prescriptionRepository.findByUserIdOrderByPrescriptionDateDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PrescriptionResponse getPrescriptionById(Long id, Long userId) {
        Prescription prescription = prescriptionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        return mapToResponse(prescription);
    }

    @Transactional
    public PrescriptionResponse createPrescription(Long userId, PrescriptionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Guard against saving the same prescription twice (which would create duplicate
        // medicines, reminder schedules and today's dose logs).
        if (!Boolean.TRUE.equals(request.getAllowDuplicate())) {
            String incoming = fingerprint(request.getDoctorName(), request.getPrescriptionDate(),
                    request.getMedicines() == null ? List.of() : request.getMedicines().stream()
                            .map(m -> m.getName() + "|" + m.getDose())
                            .collect(Collectors.toList()));
            boolean duplicate = prescriptionRepository.findByUserIdOrderByPrescriptionDateDesc(userId).stream()
                    .anyMatch(existing -> fingerprint(existing).equals(incoming));
            if (duplicate) {
                throw new DuplicatePrescriptionException(
                        "This prescription already exists in your records. Open it from your history, or confirm to save a copy.");
            }
        }

        Doctor doctor = null;
        if (request.getDoctorId() != null) {
            doctor = doctorRepository.findByIdAndUserId(request.getDoctorId(), userId).orElse(null);
        }

        Prescription prescription = Prescription.builder()
                .user(user)
                .doctor(doctor)
                .doctorName(request.getDoctorName())
                .hospitalOrClinic(request.getHospitalOrClinic())
                .prescriptionDate(request.getPrescriptionDate())
                .diagnosis(request.getDiagnosis())
                .notes(request.getNotes())
                .imageUrl(request.getImageUrl())
                .rawOcrText(request.getRawOcrText())
                .build();

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        if (request.getMedicines() != null && !request.getMedicines().isEmpty()) {
            for (MedicineRequest medReq : request.getMedicines()) {
                Medicine medicine = Medicine.builder()
                        .user(user)
                        .prescription(savedPrescription)
                        .name(medReq.getName())
                        .genericName(medReq.getGenericName())
                        // An unreadable strength is stored empty, never invented.
                        .dose(medReq.getDose() != null ? medReq.getDose().trim() : "")
                        .form(medReq.getForm() != null ? medReq.getForm() : "TABLET")
                        .frequency(medReq.getFrequency() != null ? medReq.getFrequency() : "ONCE_DAILY")
                        .foodInstruction(medReq.getFoodInstruction() != null ? medReq.getFoodInstruction() : "AFTER_MEAL")
                        .startDate(medReq.getStartDate() != null ? medReq.getStartDate() : request.getPrescriptionDate())
                        .endDate(medReq.getEndDate())
                        .durationDays(medReq.getDurationDays())
                        .instructions(medReq.getInstructions())
                        .isActive(medReq.getIsActive() != null ? medReq.getIsActive() : true)
                        .build();

                Medicine savedMed = medicineRepository.save(medicine);
                List<MedicineSchedule> createdSchedules = new ArrayList<>();

                if (medReq.getSchedules() != null && !medReq.getSchedules().isEmpty()) {
                    for (MedicineScheduleDto schDto : medReq.getSchedules()) {
                        MedicineSchedule schedule = MedicineSchedule.builder()
                                .medicine(savedMed)
                                .time(schDto.getTime())
                                .label(schDto.getLabel() != null ? schDto.getLabel() : "MORNING")
                                .dosageAmount(schDto.getDosageAmount() != null ? schDto.getDosageAmount() : "1 Tablet")
                                .foodInstruction(schDto.getFoodInstruction() != null ? schDto.getFoodInstruction() : savedMed.getFoodInstruction())
                                .isEnabled(schDto.getIsEnabled() != null ? schDto.getIsEnabled() : true)
                                .build();
                        scheduleRepository.save(schedule);
                        savedMed.getSchedules().add(schedule);
                        createdSchedules.add(schedule);
                    }
                } else {
                    // No reminder time was stated/selected: create one editable morning
                    // reminder so the medicine still appears in the reminder list.
                    MedicineSchedule defaultSchedule = MedicineSchedule.builder()
                            .medicine(savedMed)
                            .time("08:00 AM")
                            .label("MORNING")
                            .dosageAmount("1 dose")
                            .foodInstruction(savedMed.getFoodInstruction())
                            .isEnabled(true)
                            .build();
                    scheduleRepository.save(defaultSchedule);
                    savedMed.getSchedules().add(defaultSchedule);
                    createdSchedules.add(defaultSchedule);
                }

                // Auto-seed today's logs for immediate dashboard schedule display and speech notifications
                for (MedicineSchedule s : createdSchedules) {
                    if (s.getIsEnabled()) {
                        MedicineLog logItem = MedicineLog.builder()
                                .user(user)
                                .medicine(savedMed)
                                .scheduleId(s.getId())
                                .medicineName(savedMed.getName())
                                .dose(s.getDosageAmount())
                                .scheduledTime(s.getTime())
                                .status("PENDING")
                                .foodInstruction(s.getFoodInstruction())
                                .build();
                        medicineLogRepository.save(logItem);
                    }
                }

                savedPrescription.getMedicines().add(savedMed);
            }
        }

        return mapToResponse(savedPrescription);
    }

    /**
     * Content fingerprint used to detect a prescription the patient already saved.
     * Deliberately excludes the OCR text and image so re-scanning the same page is caught.
     */
    private String fingerprint(Prescription prescription) {
        List<String> medicines = prescription.getMedicines().stream()
                .map(m -> m.getName() + "|" + m.getDose())
                .collect(Collectors.toList());
        return fingerprint(prescription.getDoctorName(), prescription.getPrescriptionDate(), medicines);
    }

    static String fingerprint(String doctorName, java.time.LocalDate date, List<String> medicines) {
        String doctor = normalizeKey(doctorName);
        String day = date != null ? date.toString() : "";
        String meds = medicines.stream()
                .map(PrescriptionService::normalizeKey)
                .sorted()
                .collect(Collectors.joining(","));
        return doctor + "#" + day + "#" + meds;
    }

    private static String normalizeKey(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    @Transactional
    public void deletePrescription(Long id, Long userId) {
        Prescription prescription = prescriptionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        prescriptionRepository.delete(prescription);
    }

    public PrescriptionResponse mapToResponse(Prescription p) {
        List<MedicineResponse> medResponses = p.getMedicines().stream()
                .map(medicineService::mapToResponse)
                .collect(Collectors.toList());

        return PrescriptionResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .doctorId(p.getDoctor() != null ? p.getDoctor().getId() : null)
                .doctorName(p.getDoctorName())
                .hospitalOrClinic(p.getHospitalOrClinic())
                .prescriptionDate(p.getPrescriptionDate())
                .diagnosis(p.getDiagnosis())
                .notes(p.getNotes())
                .imageUrl(p.getImageUrl())
                .rawOcrText(p.getRawOcrText())
                .medicines(medResponses)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
