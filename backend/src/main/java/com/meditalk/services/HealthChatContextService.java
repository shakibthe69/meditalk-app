package com.meditalk.services;

import com.meditalk.dto.MedicineResponse;
import com.meditalk.dto.MedicineScheduleDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds the patient context handed to the health AI.
 *
 * <p>Only the patient's own <em>confirmed</em> medication records are used. Raw OCR
 * text, doctor notes and unrelated personal data are deliberately excluded, and the
 * list is capped and trimmed so a chat request never ships unnecessary information.</p>
 */
@Service
public class HealthChatContextService {

    private static final Logger log = LoggerFactory.getLogger(HealthChatContextService.class);
    private static final int MAX_MEDICINES = 15;
    private static final int MAX_NAME_LENGTH = 60;

    private final MedicineService medicineService;

    public HealthChatContextService(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    /**
     * Active, confirmed medicines for the patient, de-duplicated by name + dose so the
     * chat does not repeat the same medicine from more than one saved prescription.
     * Returns an empty list when the user is unknown or the lookup fails, so a chat
     * request can never fail because of it.
     */
    public List<MedicineResponse> getActiveMedicines(Long userId) {
        if (userId == null) {
            return List.of();
        }
        try {
            List<MedicineResponse> medicines = medicineService.getAllMedicines(userId, true);
            if (medicines == null || medicines.isEmpty()) {
                return List.of();
            }
            Map<String, MedicineResponse> distinct = new LinkedHashMap<>();
            for (MedicineResponse medicine : medicines) {
                String key = (medicine.getName() == null ? "" : medicine.getName().toLowerCase(Locale.ROOT))
                        + "|" + (medicine.getDose() == null ? "" : medicine.getDose().toLowerCase(Locale.ROOT));
                distinct.putIfAbsent(key, medicine);
            }
            return List.copyOf(distinct.values());
        } catch (Exception e) {
            log.warn("Could not load medicines for user {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    /**
     * @return a short bullet list of the user's active medicines, or null when the
     *         user is unknown or has no confirmed medication records.
     */
    public String buildMedicationContext(Long userId) {
        return buildMedicationContext(getActiveMedicines(userId));
    }

    /**
     * Formats an already-loaded medicine list so the chat does not query twice.
     *
     * @return the bullet list, or null when there is nothing to send.
     */
    public String buildMedicationContext(List<MedicineResponse> medicines) {
        if (medicines == null || medicines.isEmpty()) {
            return null;
        }
        try {
            String context = medicines.stream()
                    .limit(MAX_MEDICINES)
                    .map(this::formatMedicine)
                    .collect(Collectors.joining("\n"));

            return context.isBlank() ? null : context;
        } catch (Exception e) {
            // Context is an enhancement only — never fail the chat because of it.
            log.warn("Could not format medication context: {}", e.getMessage());
            return null;
        }
    }

    private String formatMedicine(MedicineResponse medicine) {
        StringBuilder sb = new StringBuilder("- ").append(truncate(medicine.getName()));

        if (medicine.getDose() != null && !medicine.getDose().isBlank()) {
            sb.append(" (").append(truncate(medicine.getDose())).append(")");
        }
        if (medicine.getFrequency() != null && !medicine.getFrequency().isBlank()) {
            sb.append(", frequency ").append(medicine.getFrequency().replace('_', ' ').toLowerCase());
        }
        if (medicine.getFoodInstruction() != null && !medicine.getFoodInstruction().isBlank()) {
            sb.append(", ").append(medicine.getFoodInstruction().replace('_', ' ').toLowerCase());
        }

        List<MedicineScheduleDto> schedules = medicine.getSchedules();
        if (schedules != null && !schedules.isEmpty()) {
            String times = schedules.stream()
                    .filter(s -> Boolean.TRUE.equals(s.getIsEnabled()))
                    .map(MedicineScheduleDto::getTime)
                    .filter(t -> t != null && !t.isBlank())
                    .limit(6)
                    .collect(Collectors.joining(", "));
            if (!times.isBlank()) {
                sb.append(", reminder times ").append(times);
            }
        }

        if (medicine.getDurationDays() != null && medicine.getDurationDays() > 0) {
            sb.append(", duration ").append(medicine.getDurationDays()).append(" days");
        }

        return sb.toString();
    }

    private String truncate(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim().replaceAll("\\s+", " ");
        return trimmed.length() <= MAX_NAME_LENGTH ? trimmed : trimmed.substring(0, MAX_NAME_LENGTH) + "…";
    }
}
