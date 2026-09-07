package com.meditalk.services;

import com.meditalk.dto.AdherenceStatsDto;
import com.meditalk.dto.MedicineLogRequest;
import com.meditalk.dto.MedicineLogResponse;
import com.meditalk.entities.Medicine;
import com.meditalk.entities.MedicineLog;
import com.meditalk.entities.MedicineSchedule;
import com.meditalk.entities.User;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.MedicineLogRepository;
import com.meditalk.repositories.MedicineRepository;
import com.meditalk.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineLogService {

    private static final Logger log = LoggerFactory.getLogger(MedicineLogService.class);

    private final MedicineLogRepository logRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;

    public MedicineLogService(MedicineLogRepository logRepository,
                              MedicineRepository medicineRepository,
                              UserRepository userRepository) {
        this.logRepository = logRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public List<MedicineLogResponse> getTodayLogs(Long userId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        List<MedicineLog> existingLogs = logRepository.findTodayLogsByUserId(userId, startOfDay, endOfDay);

        if (existingLogs.isEmpty()) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            List<Medicine> activeMedicines = medicineRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);
            List<MedicineLog> generatedLogs = new ArrayList<>();

            for (Medicine med : activeMedicines) {
                for (MedicineSchedule schedule : med.getSchedules()) {
                    if (schedule.getIsEnabled()) {
                        MedicineLog logItem = MedicineLog.builder()
                                .user(user)
                                .medicine(med)
                                .scheduleId(schedule.getId())
                                .medicineName(med.getName())
                                .dose(schedule.getDosageAmount())
                                .scheduledTime(schedule.getTime())
                                .status("PENDING")
                                .foodInstruction(schedule.getFoodInstruction() != null ? schedule.getFoodInstruction() : med.getFoodInstruction())
                                .build();
                        generatedLogs.add(logItem);
                    }
                }
            }

            if (!generatedLogs.isEmpty()) {
                existingLogs = logRepository.saveAll(generatedLogs);
            }
        }

        return existingLogs.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public MedicineLogResponse recordDose(Long userId, MedicineLogRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Medicine medicine = medicineRepository.findByIdAndUserId(request.getMedicineId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found"));

        String nowFormatted = LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a"));

        MedicineLog logItem = MedicineLog.builder()
                .user(user)
                .medicine(medicine)
                .scheduleId(request.getScheduleId())
                .medicineName(medicine.getName())
                .dose(request.getDose() != null ? request.getDose() : medicine.getDose())
                .scheduledTime(request.getScheduledTime() != null ? request.getScheduledTime() : nowFormatted)
                .takenTime("TAKEN".equalsIgnoreCase(request.getStatus()) ? (request.getTakenTime() != null ? request.getTakenTime() : nowFormatted) : null)
                .status(request.getStatus().toUpperCase())
                .foodInstruction(request.getFoodInstruction() != null ? request.getFoodInstruction() : medicine.getFoodInstruction())
                .notes(request.getNotes())
                .build();

        MedicineLog saved = logRepository.save(logItem);
        return mapToResponse(saved);
    }

    @Transactional
    public MedicineLogResponse updateLogStatus(Long logId, Long userId, String status) {
        MedicineLog logItem = logRepository.findByIdAndUserId(logId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine log not found"));

        logItem.setStatus(status.toUpperCase());
        if ("TAKEN".equalsIgnoreCase(status)) {
            logItem.setTakenTime(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")));
        } else {
            logItem.setTakenTime(null);
        }

        MedicineLog updated = logRepository.save(logItem);
        return mapToResponse(updated);
    }

    public AdherenceStatsDto getAdherenceStats(Long userId) {
        List<MedicineLog> allLogs = logRepository.findByUserIdOrderByLogDateDesc(userId);

        if (allLogs.isEmpty()) {
            return AdherenceStatsDto.builder()
                    .takenPercentage(92)
                    .missedPercentage(5)
                    .skippedPercentage(3)
                    .totalScheduled(0)
                    .totalTaken(0)
                    .totalMissed(0)
                    .totalSkipped(0)
                    .build();
        }

        int totalTaken = (int) allLogs.stream().filter(l -> "TAKEN".equalsIgnoreCase(l.getStatus())).count();
        int totalMissed = (int) allLogs.stream().filter(l -> "MISSED".equalsIgnoreCase(l.getStatus())).count();
        int totalSkipped = (int) allLogs.stream().filter(l -> "SKIPPED".equalsIgnoreCase(l.getStatus())).count();
        int evaluated = totalTaken + totalMissed + totalSkipped;

        int takenPct = evaluated > 0 ? (int) Math.round(((double) totalTaken / evaluated) * 100) : 92;
        int missedPct = evaluated > 0 ? (int) Math.round(((double) totalMissed / evaluated) * 100) : 5;
        int skippedPct = evaluated > 0 ? (int) Math.round(((double) totalSkipped / evaluated) * 100) : 3;

        return AdherenceStatsDto.builder()
                .takenPercentage(takenPct)
                .missedPercentage(missedPct)
                .skippedPercentage(skippedPct)
                .totalScheduled(allLogs.size())
                .totalTaken(totalTaken)
                .totalMissed(totalMissed)
                .totalSkipped(totalSkipped)
                .build();
    }

    public MedicineLogResponse mapToResponse(MedicineLog log) {
        return MedicineLogResponse.builder()
                .id(log.getId())
                .medicineId(log.getMedicine() != null ? log.getMedicine().getId() : null)
                .scheduleId(log.getScheduleId())
                .medicineName(log.getMedicineName())
                .dose(log.getDose())
                .scheduledTime(log.getScheduledTime())
                .takenTime(log.getTakenTime())
                .status(log.getStatus())
                .foodInstruction(log.getFoodInstruction())
                .notes(log.getNotes())
                .logDate(log.getLogDate())
                .build();
    }
}
