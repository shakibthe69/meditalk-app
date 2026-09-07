package com.meditalk.services;

import com.meditalk.dto.MedicineRequest;
import com.meditalk.dto.MedicineResponse;
import com.meditalk.dto.MedicineScheduleDto;
import com.meditalk.entities.Medicine;
import com.meditalk.entities.MedicineSchedule;
import com.meditalk.entities.Prescription;
import com.meditalk.entities.User;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.MedicineRepository;
import com.meditalk.repositories.MedicineScheduleRepository;
import com.meditalk.repositories.PrescriptionRepository;
import com.meditalk.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final MedicineScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final PrescriptionRepository prescriptionRepository;

    public MedicineService(MedicineRepository medicineRepository,
                           MedicineScheduleRepository scheduleRepository,
                           UserRepository userRepository,
                           PrescriptionRepository prescriptionRepository) {
        this.medicineRepository = medicineRepository;
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.prescriptionRepository = prescriptionRepository;
    }

    public List<MedicineResponse> getAllMedicines(Long userId, Boolean activeOnly) {
        List<Medicine> list = (activeOnly != null && activeOnly)
                ? medicineRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                : medicineRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public MedicineResponse getMedicineById(Long id, Long userId) {
        Medicine medicine = medicineRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
        return mapToResponse(medicine);
    }

    @Transactional
    public MedicineResponse createMedicine(Long userId, MedicineRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Prescription prescription = null;
        if (request.getPrescriptionId() != null) {
            prescription = prescriptionRepository.findByIdAndUserId(request.getPrescriptionId(), userId).orElse(null);
        }

        Medicine medicine = Medicine.builder()
                .user(user)
                .prescription(prescription)
                .name(request.getName())
                .genericName(request.getGenericName())
                .dose(request.getDose())
                .form(request.getForm() != null ? request.getForm() : "TABLET")
                .frequency(request.getFrequency() != null ? request.getFrequency() : "ONCE_DAILY")
                .foodInstruction(request.getFoodInstruction() != null ? request.getFoodInstruction() : "AFTER_MEAL")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .durationDays(request.getDurationDays())
                .instructions(request.getInstructions())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        Medicine savedMed = medicineRepository.save(medicine);

        if (request.getSchedules() != null && !request.getSchedules().isEmpty()) {
            for (MedicineScheduleDto schDto : request.getSchedules()) {
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
            }
        }

        return mapToResponse(savedMed);
    }

    @Transactional
    public MedicineResponse updateMedicine(Long id, Long userId, MedicineRequest request) {
        Medicine medicine = medicineRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        medicine.setName(request.getName());
        medicine.setGenericName(request.getGenericName());
        medicine.setDose(request.getDose());
        medicine.setForm(request.getForm());
        medicine.setFrequency(request.getFrequency());
        medicine.setFoodInstruction(request.getFoodInstruction());
        medicine.setStartDate(request.getStartDate());
        medicine.setEndDate(request.getEndDate());
        medicine.setDurationDays(request.getDurationDays());
        medicine.setInstructions(request.getInstructions());
        if (request.getIsActive() != null) medicine.setIsActive(request.getIsActive());

        if (request.getSchedules() != null) {
            scheduleRepository.deleteAll(medicine.getSchedules());
            medicine.getSchedules().clear();

            for (MedicineScheduleDto schDto : request.getSchedules()) {
                MedicineSchedule schedule = MedicineSchedule.builder()
                        .medicine(medicine)
                        .time(schDto.getTime())
                        .label(schDto.getLabel() != null ? schDto.getLabel() : "MORNING")
                        .dosageAmount(schDto.getDosageAmount() != null ? schDto.getDosageAmount() : "1 Tablet")
                        .foodInstruction(schDto.getFoodInstruction() != null ? schDto.getFoodInstruction() : medicine.getFoodInstruction())
                        .isEnabled(schDto.getIsEnabled() != null ? schDto.getIsEnabled() : true)
                        .build();
                scheduleRepository.save(schedule);
                medicine.getSchedules().add(schedule);
            }
        }

        Medicine updated = medicineRepository.save(medicine);
        return mapToResponse(updated);
    }

    @Transactional
    public MedicineResponse toggleActive(Long id, Long userId) {
        Medicine medicine = medicineRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));

        medicine.setIsActive(!medicine.getIsActive());
        Medicine updated = medicineRepository.save(medicine);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteMedicine(Long id, Long userId) {
        Medicine medicine = medicineRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
        medicineRepository.delete(medicine);
    }

    public MedicineResponse mapToResponse(Medicine med) {
        List<MedicineScheduleDto> scheduleDtos = med.getSchedules().stream()
                .map(s -> MedicineScheduleDto.builder()
                        .id(s.getId())
                        .time(s.getTime())
                        .label(s.getLabel())
                        .dosageAmount(s.getDosageAmount())
                        .foodInstruction(s.getFoodInstruction())
                        .isEnabled(s.getIsEnabled())
                        .build())
                .collect(Collectors.toList());

        return MedicineResponse.builder()
                .id(med.getId())
                .userId(med.getUser().getId())
                .prescriptionId(med.getPrescription() != null ? med.getPrescription().getId() : null)
                .name(med.getName())
                .genericName(med.getGenericName())
                .dose(med.getDose())
                .form(med.getForm())
                .frequency(med.getFrequency())
                .foodInstruction(med.getFoodInstruction())
                .startDate(med.getStartDate())
                .endDate(med.getEndDate())
                .durationDays(med.getDurationDays())
                .instructions(med.getInstructions())
                .isActive(med.getIsActive())
                .schedules(scheduleDtos)
                .createdAt(med.getCreatedAt())
                .updatedAt(med.getUpdatedAt())
                .build();
    }
}
