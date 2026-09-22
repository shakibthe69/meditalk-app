package com.meditalk.services;

import com.meditalk.dto.ExtractedMedicineDto;
import com.meditalk.dto.MedicineScheduleDto;
import com.meditalk.dto.OcrParseRequest;
import com.meditalk.dto.OcrParseResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrAiParserService {

    private static final Logger log = LoggerFactory.getLogger(OcrAiParserService.class);

    // Doctor Patterns
    private static final Pattern DOCTOR_PATTERN_EN = Pattern.compile("(?i)(?:Dr\\.?|Doctor|Prof\\.?|Professor)\\s+([A-Za-z\\s\\.]+?)(?=\\n|MD|MBBS|FCPS|FRCP|MS|,|$)");
    private static final Pattern DOCTOR_PATTERN_BN = Pattern.compile("(?:ডাঃ|ডাক্তার|প্রফেসর)\\s+([\\u0980-\\u09FF\\s\\.]+?)(?=\\n|এমবিবিএস|এফসিপিএস|,|$)");

    // Hospital / Clinic Patterns
    private static final Pattern HOSPITAL_PATTERN = Pattern.compile("(?i)([A-Za-z\\u0980-\\u09FF\\s]+(?:Hospital|Clinic|Medical|Health Care|Center|হাসপাতাল|ক্লিনিক|ডায়াগনস্টিক))");

    // Dose / Strength Patterns
    private static final Pattern DOSE_PATTERN = Pattern.compile("(?i)(\\d+(?:\\.\\d+)?\\s*(?:mg|g|ml|mcg|iu|মি\\.গ্রা\\.|মিলিগ্রাম|মিলি|ট্যাবলেট|ক্যাপসুল))");

    // Frequency / Timing Patterns (English & Bangla digits)
    private static final Pattern FREQ_PATTERN_EN = Pattern.compile("(?<![\\w\\d])([0123])\\s*([+\\-])\\s*([0123])(?:\\s*([+\\-])\\s*([0123]))?(?:\\s*([+\\-])\\s*([0123]))?(?![\\w\\d])");
    private static final Pattern FREQ_PATTERN_BN = Pattern.compile("([০১২৩])\\s*([+\\-])\\s*([০১২৩])(?:\\s*([+\\-])\\s*([০১২৩]))?(?:\\s*([+\\-])\\s*([০১২৩]))?");

    // Word-based frequency
    private static final Pattern FREQ_WORDS_EN = Pattern.compile("(?i)\\b(once\\s+daily|twice\\s+daily|three\\s+times\\s+daily|four\\s+times\\s+daily|every\\s+\\d+\\s+hours?|as\\s+needed|bd|tds|tid|qid|od)\\b");
    private static final Pattern FREQ_WORDS_BN = Pattern.compile("(প্রতিদিন\\s+একবার|দিনে\\s+[১১২২৩৪]\\s*বার|প্রয়োজনে)");

    // Meal / Food Instruction Patterns
    private static final Pattern FOOD_PATTERN_EN = Pattern.compile("(?i)(before\\s+(?:meals?|food|breakfast)|after\\s+(?:meals?|food|lunch|dinner)|with\\s+(?:meals?|food)|empty\\s+stomach)");
    private static final Pattern FOOD_PATTERN_BN = Pattern.compile("(খাবারের\\s+আগে|খাবারের\\s+পরে|ভরা\\s+পেটে|খালি\\s+পেটে|খাওয়ার\\s+পূর্বে|খাওয়ার\\s+পরে|নাস্তার\\s+আগে|নাস্তার\\s+পরে|রাতের\\s+খাবারের\\s+পরে)");

    // Duration Patterns
    private static final Pattern DURATION_PATTERN_EN = Pattern.compile("(?i)(?:for\\s+)?(\\d+\\s*(?:days?|weeks?|months?|years?))");
    private static final Pattern DURATION_PATTERN_BN = Pattern.compile("([০-৯\\d]+\\s*(?:দিন|সপ্তাহ|মাস|বছর)|চলবে)");

    // Bengali digit mapping
    private static final Map<Character, Character> BN_TO_EN_DIGITS = Map.of(
            '০', '0', '১', '1', '২', '2', '৩', '3', '৪', '4',
            '৫', '5', '৬', '6', '৭', '7', '৮', '8', '৯', '9'
    );

    public OcrParseResponse parsePrescriptionText(OcrParseRequest request) {
        return parsePrescriptionTextWithMetadata(
                request.getRawText(),
                request.getImageUri(),
                List.of("en", "bn"),
                0.92,
                "Text parsed directly"
        );
    }

    public OcrParseResponse parsePrescriptionTextWithMetadata(
            String rawText,
            String imageUrl,
            List<String> detectedLanguages,
            double overallConfidence,
            String preprocessingSummary
    ) {
        if (rawText == null || rawText.isBlank()) {
            return OcrParseResponse.builder()
                    .rawOcrText("")
                    .imageUrl(imageUrl)
                    .detectedLanguages(detectedLanguages)
                    .confidenceScore(0.0)
                    .preprocessingSummary(preprocessingSummary)
                    .requiresUserVerification(true)
                    .safetyDisclaimer("Meditalk helps organize your medical information. Always verify extracted information with your doctor's original prescription.")
                    .build();
        }

        String doctorName = extractDoctor(rawText);
        String hospital = extractHospital(rawText);
        String prescriptionDate = extractDate(rawText);
        String diagnosis = extractDiagnosis(rawText);
        List<ExtractedMedicineDto> extractedMedicines = extractMedicines(rawText);

        return OcrParseResponse.builder()
                .doctorName(doctorName)
                .hospitalOrClinic(hospital)
                .prescriptionDate(prescriptionDate != null ? prescriptionDate : LocalDate.now().toString())
                .diagnosis(diagnosis)
                .rawOcrText(rawText)
                .imageUrl(imageUrl)
                .medicines(extractedMedicines)
                .detectedLanguages(detectedLanguages)
                .confidenceScore(overallConfidence)
                .preprocessingSummary(preprocessingSummary)
                .notes(extractedMedicines.isEmpty() ? "No medicines automatically detected. You can review and enter details manually." : "AI Extracted Draft. Please verify each dosage, timing, and instruction carefully.")
                .requiresUserVerification(true)
                .safetyDisclaimer("Meditalk AI organizes extracted text for your convenience. It does not replace medical advice. Always verify with your original prescription.")
                .build();
    }

    private String extractDoctor(String text) {
        Matcher matcherBn = DOCTOR_PATTERN_BN.matcher(text);
        if (matcherBn.find()) {
            return matcherBn.group(0).trim();
        }

        Matcher matcherEn = DOCTOR_PATTERN_EN.matcher(text);
        if (matcherEn.find()) {
            return matcherEn.group(0).replaceAll("(?i)\\s+(MD|MBBS|FRCP|FCPS)$", "").trim();
        }

        for (String line : text.split("\\r?\\n")) {
            String trimmed = line.trim();
            String lower = trimmed.toLowerCase();
            if (lower.startsWith("dr.") || lower.startsWith("dr ") || lower.startsWith("doctor") || trimmed.startsWith("ডাঃ") || trimmed.startsWith("ডাক্তার")) {
                return trimmed;
            }
        }
        return null;
    }

    private String extractHospital(String text) {
        Matcher matcher = HOSPITAL_PATTERN.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    private String extractDate(String text) {
        Pattern datePattern = Pattern.compile("(?i)(?:Date|তারিখ)[\\s:]*(\\d{1,4}[\\-/\\.][\\d\\w]{1,4}[\\-/\\.]\\d{1,4})");
        Matcher matcher = datePattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return LocalDate.now().toString();
    }

    private String extractDiagnosis(String text) {
        Pattern diagPattern = Pattern.compile("(?i)(?:Diagnosis|Dx|C/C|Chief Complaints?|রোগ নির্ণয়)[\\s:]*([A-Za-z\\u0980-\\u09FF\\s,]+?)(?=\\n|Rx|\\d+\\.|$)");
        Matcher matcher = diagPattern.matcher(text);
        if (matcher.find()) {
            String diag = matcher.group(1).trim();
            if (!diag.isBlank()) return diag;
        }
        return "Prescription consultation";
    }

    public List<ExtractedMedicineDto> extractMedicines(String text) {
        List<ExtractedMedicineDto> list = new ArrayList<>();
        String[] lines = text.split("\\r?\\n");

        ExtractedMedicineDto currentMed = null;

        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isBlank() || isHeaderLine(line)) {
                continue;
            }

            // Check if line indicates a new medicine (starts with number bullet, Tab/Cap/Syp/Rx, or contains dose)
            boolean isNewMedLine = isMedicineStartLine(line);

            if (isNewMedLine) {
                if (currentMed != null && isValidMedicine(currentMed)) {
                    buildSchedulesForMedicine(currentMed);
                    list.add(currentMed);
                }
                currentMed = parseNewMedicineLine(line);
            } else if (currentMed != null) {
                // Secondary details line (frequency, food, duration)
                enrichMedicineDetails(line, currentMed);
            }
        }

        if (currentMed != null && isValidMedicine(currentMed)) {
            buildSchedulesForMedicine(currentMed);
            list.add(currentMed);
        }

        return list;
    }

    private boolean isHeaderLine(String line) {
        String lower = line.toLowerCase();
        return lower.startsWith("dr.") || lower.startsWith("dr ") || lower.startsWith("doctor") ||
                lower.startsWith("date") || lower.startsWith("hospital") || lower.startsWith("clinic") ||
                lower.startsWith("patient") || lower.startsWith("age") || lower.startsWith("sex") ||
                lower.startsWith("ডাঃ") || lower.startsWith("তারিখ") || lower.equals("rx");
    }

    // Common medicine dictionary (English & Bengali)
    private static final List<String> KNOWN_MEDICINE_NAMES = List.of(
            "Napa Extra", "Napa Extend", "Napa Rapid", "Napa", "Paracetamol", "Ace Plus", "Ace", "Fast", "Reset", "Renova",
            "Seclo", "Losectil", "Omeprazole", "Sergel", "Esomeprazole", "Maxpro", "Nexum", "Proceptin",
            "Pantonix", "Pantoprazole", "Penta", "Pantobex", "Trupan",
            "Rosuva", "Rosuvastatin", "Atova", "Atorvastatin", "Lipicon", "Rostat", "Anzitor",
            "Monas", "Montene", "Montelukast", "Odmon", "Mona", "Airon",
            "Fexo", "Fexofenadine", "Alatrol", "Cetirizine", "Histacin", "Tofen", "Telfast", "Rhinil",
            "Azithromycin", "Zithrin", "A-Zith", "Tridosil", "Zimax",
            "Ciprocin", "Ciprofloxacin", "Neocipro", "Cipro",
            "Bizoran", "Olmesartan", "Amlodipine", "Camlosart", "Olmetor", "Angilock", "Losartan",
            "Betaloc", "Metoprolol", "Bislol", "Bisoprolol", "Carvista", "Cardibis",
            "Bicozin", "Calbo-D", "Calbo", "Calcium", "Ostocal", "Aristocal", "D-Rise", "Vitabion",
            "নাপা এক্সট্রা", "নাপা", "প্যারাসিটামল", "সেকলো", "সারজেল", "ম্যাক্সপ্রো", "ওমেপ্রাজল",
            "প্যান্টোনিক্স", "রোসুভা", "মোনাস", "ফিক্সো", "টফেন", "ক্যালবো ডি", "ক্যালবো", "বিকোজিন"
    );

    private boolean isMedicineStartLine(String line) {
        String lower = line.toLowerCase();
        for (String med : KNOWN_MEDICINE_NAMES) {
            if (lower.contains(med.toLowerCase())) {
                return true;
            }
        }
        // Starts with bullet: 1. 2. or ১. ২.
        if (line.matches("^([\\d০-৯]+[\\.\\)\\-]|Rx|R/x|Tab\\.?|Cap\\.?|Syp\\.?|Inj\\.?|ট্যাব\\.?|ক্যাপ\\.?|সিরাপ).*")) {
            return true;
        }
        // Contains standard dose like 500mg, 20mg
        Matcher doseMatcher = DOSE_PATTERN.matcher(line);
        return doseMatcher.find();
    }

    private ExtractedMedicineDto parseNewMedicineLine(String line) {
        String cleaned = line.replaceFirst("^([\\d০-৯]+[\\.\\)\\-]|Rx|R/x)\\s*", "").trim();

        String form = "TABLET";
        if (cleaned.toLowerCase().matches("^(cap|capsule|ক্যাপ).*")) {
            form = "CAPSULE";
            cleaned = cleaned.replaceFirst("^(?i)(cap\\.?|capsule|ক্যাপ\\.?)\\s*", "");
        } else if (cleaned.toLowerCase().matches("^(syp|syrup|সিরাপ).*")) {
            form = "SYRUP";
            cleaned = cleaned.replaceFirst("^(?i)(syp\\.?|syrup|সিরাপ)\\s*", "");
        } else if (cleaned.toLowerCase().matches("^(inj|injection|ইনজেকশন).*")) {
            form = "INJECTION";
            cleaned = cleaned.replaceFirst("^(?i)(inj\\.?|injection|ইনজেকশন)\\s*", "");
        } else if (cleaned.toLowerCase().matches("^(drops?|ড্রপ).*")) {
            form = "DROPS";
            cleaned = cleaned.replaceFirst("^(?i)(drops?\\.?|ড্রপ)\\s*", "");
        } else if (cleaned.toLowerCase().matches("^(tab|tablet|ট্যাব).*")) {
            form = "TABLET";
            cleaned = cleaned.replaceFirst("^(?i)(tab\\.?|tablet|ট্যাব\\.?)\\s*", "");
        }

        // Check against known medicine dictionary
        for (String knownMed : KNOWN_MEDICINE_NAMES) {
            Pattern knownPattern = Pattern.compile("(?i)\\b" + Pattern.quote(knownMed) + "\\b");
            Matcher km = knownPattern.matcher(cleaned);
            if (km.find()) {
                String dose = "";
                Matcher dm = DOSE_PATTERN.matcher(cleaned);
                if (dm.find()) {
                    dose = dm.group(1).trim();
                }

                ExtractedMedicineDto med = ExtractedMedicineDto.builder()
                        .name(knownMed)
                        .dose(dose)
                        .form(form)
                        .frequency("ONCE_DAILY")
                        .dosePattern("1+0+0")
                        .timing(new ArrayList<>(List.of("morning")))
                        .foodInstruction("AFTER_MEAL")
                        .confidenceScore(0.98)
                        .isUncertain(false)
                        .build();

                enrichMedicineDetails(cleaned, med);
                return med;
            }
        }

        String dose = "";
        String name = cleaned;

        Matcher doseMatcher = DOSE_PATTERN.matcher(cleaned);
        if (doseMatcher.find()) {
            dose = doseMatcher.group(1).trim();
            name = cleaned.substring(0, doseMatcher.start()).replaceAll("[^a-zA-Z0-9\\u0980-\\u09FF\\s\\-]", "").trim();
            String remainder = cleaned.substring(doseMatcher.end()).trim();

            ExtractedMedicineDto med = ExtractedMedicineDto.builder()
                    .name(name.isBlank() ? "Prescribed Medicine" : name)
                    .dose(dose)
                    .form(form)
                    .frequency("ONCE_DAILY")
                    .dosePattern("1+0+0")
                    .timing(new ArrayList<>(List.of("morning")))
                    .foodInstruction("AFTER_MEAL")
                    .confidenceScore(0.95)
                    .isUncertain(false)
                    .build();

            if (!remainder.isBlank()) {
                enrichMedicineDetails(remainder, med);
            }
            return med;
        }

        ExtractedMedicineDto med = ExtractedMedicineDto.builder()
                .name(name.isBlank() ? "Prescribed Medicine" : name)
                .dose(dose)
                .form(form)
                .frequency("ONCE_DAILY")
                .dosePattern("1+0+0")
                .timing(new ArrayList<>(List.of("morning")))
                .foodInstruction("AFTER_MEAL")
                .isUncertain(true)
                .confidenceScore(0.70)
                .build();

        enrichMedicineDetails(cleaned, med);
        return med;
    }

    private void enrichMedicineDetails(String line, ExtractedMedicineDto med) {
        // 1. Frequency (Bangla & English patterns e.g. 1+1+1, ১+০+১)
        String convertedLine = convertBnDigitsToEn(line);
        Matcher freqMatcher = FREQ_PATTERN_EN.matcher(convertedLine);

        if (freqMatcher.find()) {
            int morning = Integer.parseInt(freqMatcher.group(1));
            int noon = Integer.parseInt(freqMatcher.group(3));
            String nightStr = freqMatcher.group(5);
            String fourthStr = freqMatcher.group(7);

            int night = (nightStr != null) ? Integer.parseInt(nightStr) : 0;
            int fourth = (fourthStr != null) ? Integer.parseInt(fourthStr) : 0;

            String patternStr;
            List<String> timing = new ArrayList<>();

            if (fourthStr != null) {
                patternStr = morning + "+" + noon + "+" + night + "+" + fourth;
                if (morning > 0) timing.add("morning");
                if (noon > 0) timing.add("afternoon");
                if (night > 0) timing.add("evening");
                if (fourth > 0) timing.add("night");
                med.setFrequency("FOUR_TIMES_DAILY");
            } else if (nightStr != null) {
                patternStr = morning + "+" + noon + "+" + night;
                if (morning > 0) timing.add("morning");
                if (noon > 0) timing.add("afternoon");
                if (night > 0) timing.add("night");

                int totalDoses = morning + noon + night;
                if (totalDoses >= 3) {
                    med.setFrequency("THRICE_DAILY");
                } else if (totalDoses == 2) {
                    med.setFrequency("TWICE_DAILY");
                } else {
                    med.setFrequency("ONCE_DAILY");
                }
            } else {
                patternStr = morning + "+" + noon;
                if (morning > 0) timing.add("morning");
                if (noon > 0) timing.add("night");
                med.setFrequency("TWICE_DAILY");
            }

            med.setDosePattern(patternStr);
            med.setTiming(timing.isEmpty() ? List.of("morning") : timing);
        } else {
            // Check word frequency
            Matcher wordMatcherEn = FREQ_WORDS_EN.matcher(line);
            if (wordMatcherEn.find()) {
                String w = wordMatcherEn.group(1).toLowerCase();
                if (w.contains("twice") || w.equals("bd")) {
                    med.setFrequency("TWICE_DAILY");
                    med.setDosePattern("1+0+1");
                    med.setTiming(List.of("morning", "night"));
                } else if (w.contains("three") || w.equals("tds") || w.equals("tid")) {
                    med.setFrequency("THRICE_DAILY");
                    med.setDosePattern("1+1+1");
                    med.setTiming(List.of("morning", "afternoon", "night"));
                } else if (w.contains("four") || w.equals("qid")) {
                    med.setFrequency("FOUR_TIMES_DAILY");
                    med.setDosePattern("1+1+1+1");
                    med.setTiming(List.of("morning", "afternoon", "evening", "night"));
                } else {
                    med.setFrequency("ONCE_DAILY");
                    med.setDosePattern("1+0+0");
                    med.setTiming(List.of("morning"));
                }
            } else {
                Matcher wordMatcherBn = FREQ_WORDS_BN.matcher(line);
                if (wordMatcherBn.find()) {
                    String wb = wordMatcherBn.group(1);
                    if (wb.contains("২")) {
                        med.setFrequency("TWICE_DAILY");
                        med.setDosePattern("1+0+1");
                        med.setTiming(List.of("morning", "night"));
                    } else if (wb.contains("৩")) {
                        med.setFrequency("THRICE_DAILY");
                        med.setDosePattern("1+1+1");
                        med.setTiming(List.of("morning", "afternoon", "night"));
                    } else if (wb.contains("৪")) {
                        med.setFrequency("FOUR_TIMES_DAILY");
                        med.setDosePattern("1+1+1+1");
                        med.setTiming(List.of("morning", "afternoon", "evening", "night"));
                    } else {
                        med.setFrequency("ONCE_DAILY");
                        med.setDosePattern("1+0+0");
                        med.setTiming(List.of("morning"));
                    }
                }
            }
        }

        // 2. Food Instructions (Bangla and English)
        Matcher foodEn = FOOD_PATTERN_EN.matcher(line);
        if (foodEn.find()) {
            String f = foodEn.group(1).toLowerCase();
            if (f.contains("before")) {
                med.setFoodInstruction("BEFORE_MEAL");
            } else if (f.contains("empty")) {
                med.setFoodInstruction("EMPTY_STOMACH");
            } else if (f.contains("with")) {
                med.setFoodInstruction("WITH_MEAL");
            } else {
                med.setFoodInstruction("AFTER_MEAL");
            }
        } else {
            Matcher foodBn = FOOD_PATTERN_BN.matcher(line);
            if (foodBn.find()) {
                String fb = foodBn.group(1);
                if (fb.contains("আগে") || fb.contains("পূর্বে")) {
                    med.setFoodInstruction("BEFORE_MEAL");
                } else if (fb.contains("খালি")) {
                    med.setFoodInstruction("EMPTY_STOMACH");
                } else {
                    med.setFoodInstruction("AFTER_MEAL");
                }
            }
        }

        // 3. Duration (Bangla & English)
        Matcher durEn = DURATION_PATTERN_EN.matcher(line);
        if (durEn.find()) {
            String dur = durEn.group(1);
            med.setDuration(dur);
            Matcher numMatcher = Pattern.compile("\\d+").matcher(dur);
            if (numMatcher.find()) {
                int count = Integer.parseInt(numMatcher.group());
                if (dur.toLowerCase().contains("week")) count *= 7;
                if (dur.toLowerCase().contains("month")) count *= 30;
                if (dur.toLowerCase().contains("year")) count *= 365;
                med.setDurationDays(count);
            }
        } else {
            Matcher durBn = DURATION_PATTERN_BN.matcher(line);
            if (durBn.find()) {
                String durb = durBn.group(1);
                med.setDuration(durb);
                String enDur = convertBnDigitsToEn(durb);
                Matcher numMatcher = Pattern.compile("\\d+").matcher(enDur);
                if (numMatcher.find()) {
                    int count = Integer.parseInt(numMatcher.group());
                    if (durb.contains("সপ্তাহ")) count *= 7;
                    if (durb.contains("মাস")) count *= 30;
                    if (durb.contains("বছর")) count *= 365;
                    med.setDurationDays(count);
                }
            }
        }
    }

    private void buildSchedulesForMedicine(ExtractedMedicineDto med) {
        List<MedicineScheduleDto> schedules = new ArrayList<>();
        List<String> timing = (med.getTiming() != null && !med.getTiming().isEmpty())
                ? med.getTiming()
                : List.of("morning");

        String food = (med.getFoodInstruction() != null) ? med.getFoodInstruction() : "AFTER_MEAL";
        String dosageAmount = "1 " + (med.getForm() != null ? capitalize(med.getForm().toLowerCase()) : "Tablet");

        for (String slot : timing) {
            String time = "08:00 AM";
            String label = "MORNING";

            if (slot.equalsIgnoreCase("afternoon") || slot.equalsIgnoreCase("noon")) {
                time = "02:00 PM";
                label = "AFTERNOON";
            } else if (slot.equalsIgnoreCase("evening")) {
                time = "06:00 PM";
                label = "EVENING";
            } else if (slot.equalsIgnoreCase("night") || slot.equalsIgnoreCase("dinner")) {
                time = "10:00 PM";
                label = "NIGHT";
            }

            schedules.add(MedicineScheduleDto.builder()
                    .time(time)
                    .label(label)
                    .dosageAmount(dosageAmount)
                    .foodInstruction(food)
                    .isEnabled(true)
                    .build());
        }

        med.setSchedules(schedules);
    }

    private boolean isValidMedicine(ExtractedMedicineDto med) {
        return med.getName() != null && !med.getName().isBlank() && med.getName().length() >= 2;
    }

    private String convertBnDigitsToEn(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder();
        for (char c : input.toCharArray()) {
            sb.append(BN_TO_EN_DIGITS.getOrDefault(c, c));
        }
        return sb.toString();
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return Character.toUpperCase(str.charAt(0)) + str.substring(1).toLowerCase();
    }
}
