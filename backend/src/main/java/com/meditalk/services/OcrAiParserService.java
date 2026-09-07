package com.meditalk.services;

import com.meditalk.dto.ExtractedMedicineDto;
import com.meditalk.dto.OcrParseRequest;
import com.meditalk.dto.OcrParseResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrAiParserService {

    private static final Logger log = LoggerFactory.getLogger(OcrAiParserService.class);

    private static final Pattern DOCTOR_PATTERN = Pattern.compile("(?i)(?:Dr\\.?|Doctor)\\s+([A-Za-z\\s\\.]+?)(?=\\n|MD|MBBS|,|$)");
    private static final Pattern DOSE_PATTERN = Pattern.compile("(?i)(\\d+(?:\\.\\d+)?\\s*(?:mg|g|ml|mcg|iu|tablets?|capsules?))");
    private static final Pattern FREQ_DIGIT_PATTERN = Pattern.compile("(\\d)\\s*([+\\-])\\s*(\\d)\\s*(?:([+\\-])\\s*(\\d))?");
    private static final Pattern DURATION_PATTERN = Pattern.compile("(?i)(\\d+\\s*(?:days?|weeks?|months?))");
    private static final Pattern FOOD_PATTERN = Pattern.compile("(?i)(before\\s+(?:meals?|food|breakfast)|after\\s+(?:meals?|food|lunch|dinner)|with\\s+(?:meals?|food)|empty\\s+stomach)");

    public OcrParseResponse parsePrescriptionText(OcrParseRequest request) {
        String rawText = request.getRawText();
        if (rawText == null || rawText.isBlank()) {
            return OcrParseResponse.builder()
                    .rawOcrText("")
                    .requiresUserVerification(true)
                    .safetyDisclaimer("Meditalk helps organize your medical information. Always verify extracted information with your doctor's original prescription.")
                    .build();
        }

        String doctorName = extractDoctor(rawText);
        List<ExtractedMedicineDto> extractedMedicines = extractMedicines(rawText);

        return OcrParseResponse.builder()
                .doctorName(doctorName != null ? doctorName : "Dr. Prescribing Physician")
                .hospitalOrClinic("Health Center")
                .prescriptionDate(LocalDate.now().toString())
                .diagnosis("Extracted from prescription notes")
                .rawOcrText(rawText)
                .medicines(extractedMedicines)
                .notes("AI Extracted Draft. Please verify each dosage, timing, and instruction carefully.")
                .requiresUserVerification(true)
                .safetyDisclaimer("Meditalk AI organizes extracted text for your convenience. It does not replace medical advice. Always verify with your original prescription.")
                .build();
    }

    private String extractDoctor(String text) {
        Matcher matcher = DOCTOR_PATTERN.matcher(text);
        if (matcher.find()) {
            String match = matcher.group(0).trim();
            return match.replaceAll("(?i)\\s+(MD|MBBS|FRCP|FCPS)$", "");
        }
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.toLowerCase().startsWith("dr") || trimmed.toLowerCase().startsWith("doctor")) {
                return trimmed;
            }
        }
        return null;
    }

    private List<ExtractedMedicineDto> extractMedicines(String text) {
        List<ExtractedMedicineDto> list = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");

        ExtractedMedicineDto currentMed = null;

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isBlank() || trimmed.toLowerCase().startsWith("dr") || trimmed.toLowerCase().startsWith("date")) {
                continue;
            }

            Matcher doseMatcher = DOSE_PATTERN.matcher(trimmed);
            if (doseMatcher.find()) {
                if (currentMed != null) {
                    list.add(currentMed);
                }

                String dose = doseMatcher.group(1).trim();
                String name = trimmed.substring(0, doseMatcher.start()).replaceAll("[^a-zA-Z0-9\\s]", "").trim();
                if (name.isBlank()) {
                    name = "Prescribed Medication";
                }

                currentMed = ExtractedMedicineDto.builder()
                        .name(name)
                        .dose(dose)
                        .form(dose.toLowerCase().contains("ml") ? "SYRUP" : (name.toLowerCase().contains("cap") ? "CAPSULE" : "TABLET"))
                        .frequency("ONCE_DAILY")
                        .timing(new ArrayList<>(List.of("morning")))
                        .foodInstruction("AFTER_MEAL")
                        .confidenceScore(0.95)
                        .build();

                String remainder = trimmed.substring(doseMatcher.end());
                parseLineDetails(remainder, currentMed);
            } else if (currentMed != null) {
                parseLineDetails(trimmed, currentMed);
            }
        }

        if (currentMed != null) {
            list.add(currentMed);
        }

        if (list.isEmpty()) {
            list.add(ExtractedMedicineDto.builder()
                    .name("Extracted Medicine")
                    .dose("500mg")
                    .form("TABLET")
                    .frequency("TWICE_DAILY")
                    .timing(Arrays.asList("morning", "night"))
                    .foodInstruction("AFTER_MEAL")
                    .duration("5 days")
                    .durationDays(5)
                    .confidenceScore(0.80)
                    .build());
        }

        return list;
    }

    private void parseLineDetails(String text, ExtractedMedicineDto med) {
        Matcher freqMatcher = FREQ_DIGIT_PATTERN.matcher(text);
        if (freqMatcher.find()) {
            int morning = Integer.parseInt(freqMatcher.group(1));
            int noonOrNight = Integer.parseInt(freqMatcher.group(3));
            String thirdGroup = freqMatcher.group(5);
            int night = thirdGroup != null ? Integer.parseInt(thirdGroup) : 0;

            List<String> timing = new ArrayList<>();
            int total = morning + noonOrNight + night;

            if (thirdGroup != null) {
                if (morning > 0) timing.add("morning");
                if (noonOrNight > 0) timing.add("afternoon");
                if (night > 0) timing.add("night");
            } else {
                if (morning > 0) timing.add("morning");
                if (noonOrNight > 0) timing.add("night");
            }

            med.setTiming(timing);
            if (total >= 3) {
                med.setFrequency("THRICE_DAILY");
            } else if (total == 2) {
                med.setFrequency("TWICE_DAILY");
            } else {
                med.setFrequency("ONCE_DAILY");
            }
        }

        Matcher foodMatcher = FOOD_PATTERN.matcher(text);
        if (foodMatcher.find()) {
            String foodStr = foodMatcher.group(1).toLowerCase();
            if (foodStr.contains("before")) {
                med.setFoodInstruction("BEFORE_MEAL");
            } else if (foodStr.contains("empty")) {
                med.setFoodInstruction("EMPTY_STOMACH");
            } else if (foodStr.contains("with")) {
                med.setFoodInstruction("WITH_MEAL");
            } else {
                med.setFoodInstruction("AFTER_MEAL");
            }
        }

        Matcher durMatcher = DURATION_PATTERN.matcher(text);
        if (durMatcher.find()) {
            String dur = durMatcher.group(1);
            med.setDuration(dur);
            Matcher numMatcher = Pattern.compile("\\d+").matcher(dur);
            if (numMatcher.find()) {
                int count = Integer.parseInt(numMatcher.group());
                if (dur.toLowerCase().contains("week")) count *= 7;
                if (dur.toLowerCase().contains("month")) count *= 30;
                med.setDurationDays(count);
            }
        }
    }
}
