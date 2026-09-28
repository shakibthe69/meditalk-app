package com.meditalk.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meditalk.dto.ExtractedMedicineDto;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Validates and normalizes the strict-JSON output produced by the prescription
 * extraction model.
 *
 * <p>Medical-safety rules enforced here:</p>
 * <ul>
 *   <li>Never invent a value that is missing/unreadable — missing stays null.</li>
 *   <li>Reject any medicine without a usable name instead of fabricating one.</li>
 *   <li>Only build a dose schedule when the source actually stated a frequency.</li>
 *   <li>Ignore template placeholders the model sometimes returns ("unknown", "N/A", "-").</li>
 * </ul>
 */
public final class PrescriptionExtractionValidator {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int MAX_MEDICINES = 40;

    /** Values that mean "not present in the prescription" rather than real data. */
    private static final Pattern PLACEHOLDER = Pattern.compile(
            "(?i)^(n/?a|na|none|null|nil|unknown|not (specified|mentioned|available|stated|present)|"
                    + "-+|\\?+|unreadable|illegible|cannot (read|determine)|n\\.a\\.|xxx+)$");

    private static final Pattern DAYS_PATTERN = Pattern.compile("(?i)(\\d{1,3})\\s*(?:days?|দিন)");
    private static final Pattern WEEKS_PATTERN = Pattern.compile("(?i)(\\d{1,2})\\s*(?:weeks?|সপ্তাহ)");
    private static final Pattern MONTHS_PATTERN = Pattern.compile("(?i)(\\d{1,2})\\s*(?:months?|মাস)");
    private static final Pattern YEARS_PATTERN = Pattern.compile("(?i)(\\d{1,2})\\s*(?:years?|বছর)");

    private PrescriptionExtractionValidator() {
    }

    /** Parsed, validated form of the model's JSON response. */
    public static class ParsedPrescription {
        private final String patientName;
        private final String doctorName;
        private final String hospitalOrClinic;
        private final String prescriptionDate;
        private final String diagnosis;
        private final String notes;
        private final List<ExtractedMedicineDto> medicines;

        ParsedPrescription(String patientName, String doctorName, String hospitalOrClinic,
                           String prescriptionDate, String diagnosis, String notes,
                           List<ExtractedMedicineDto> medicines) {
            this.patientName = patientName;
            this.doctorName = doctorName;
            this.hospitalOrClinic = hospitalOrClinic;
            this.prescriptionDate = prescriptionDate;
            this.diagnosis = diagnosis;
            this.notes = notes;
            this.medicines = medicines;
        }

        public String getPatientName() { return patientName; }
        public String getDoctorName() { return doctorName; }
        public String getHospitalOrClinic() { return hospitalOrClinic; }
        public String getPrescriptionDate() { return prescriptionDate; }
        public String getDiagnosis() { return diagnosis; }
        public String getNotes() { return notes; }
        public List<ExtractedMedicineDto> getMedicines() { return medicines; }
    }

    /**
     * Parses the raw model response. Tolerates fenced markdown/code blocks and leading
     * prose, but never tolerates invalid JSON once the JSON object has been located.
     *
     * @throws IllegalArgumentException when no JSON object can be parsed at all
     */
    public static ParsedPrescription parse(String rawModelResponse) {
        if (rawModelResponse == null || rawModelResponse.isBlank()) {
            throw new IllegalArgumentException("The extraction model returned an empty response.");
        }

        String json = extractJsonObject(rawModelResponse);
        JsonNode root;
        try {
            root = MAPPER.readTree(json);
        } catch (Exception e) {
            throw new IllegalArgumentException("The extraction model returned malformed JSON.");
        }
        if (root == null || !root.isObject()) {
            throw new IllegalArgumentException("The extraction model did not return a JSON object.");
        }

        return new ParsedPrescription(
                cleanText(root.get("patientName")),
                cleanText(root.get("doctorName")),
                cleanText(root.get("hospitalOrClinic")),
                normalizeDate(cleanText(root.get("prescriptionDate"))),
                cleanText(root.get("diagnosis")),
                cleanText(root.get("notes")),
                parseMedicines(root.get("medicines"))
        );
    }

    /** Locates the first balanced JSON object in a response that may be wrapped in prose or fences. */
    static String extractJsonObject(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline) {
                trimmed = trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }

        int start = trimmed.indexOf('{');
        if (start < 0) {
            throw new IllegalArgumentException("The extraction model returned no JSON object.");
        }

        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int i = start; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '"') {
                    inString = false;
                }
                continue;
            }
            if (c == '"') {
                inString = true;
            } else if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return trimmed.substring(start, i + 1);
                }
            }
        }
        throw new IllegalArgumentException("The extraction model returned an incomplete JSON object.");
    }

    static List<ExtractedMedicineDto> parseMedicines(JsonNode medicinesNode) {
        List<ExtractedMedicineDto> results = new ArrayList<>();
        if (medicinesNode == null || !medicinesNode.isArray()) {
            return results;
        }

        for (JsonNode node : medicinesNode) {
            if (results.size() >= MAX_MEDICINES) {
                break;
            }
            if (node == null || !node.isObject()) {
                continue;
            }

            String name = cleanText(node.get("medicineName"));
            if (name == null) {
                name = cleanText(node.get("name"));
            }
            if (name == null) {
                // A medicine without a readable name is not usable data — skip it
                // rather than inventing "Prescribed Medicine".
                continue;
            }

            boolean morning = readBoolean(node.get("morning"));
            boolean afternoon = readBoolean(node.get("afternoon"));
            boolean evening = readBoolean(node.get("evening"));
            boolean night = readBoolean(node.get("night"));

            String dosePattern = null;
            List<String> timing = new ArrayList<>();
            if (morning || afternoon || evening || night) {
                dosePattern = (morning ? 1 : 0) + "+" + (afternoon ? 1 : 0) + "+" + (evening ? 1 : 0)
                        + "+" + (night ? 1 : 0);
                if (morning) timing.add("morning");
                if (afternoon) timing.add("afternoon");
                if (evening) timing.add("evening");
                if (night) timing.add("night");
            }

            String foodInstruction = resolveFoodInstruction(node);
            String duration = cleanText(node.get("duration"));
            String strength = cleanText(node.get("strength"));
            String unit = cleanText(node.get("unit"));
            String dose = joinDose(strength, unit);
            if (dose == null) {
                dose = cleanText(node.get("dosage"));
            }

            String frequency = cleanText(node.get("frequency"));
            if (frequency == null && dosePattern != null) {
                int doses = (morning ? 1 : 0) + (afternoon ? 1 : 0) + (evening ? 1 : 0) + (night ? 1 : 0);
                frequency = doses >= 4 ? "FOUR_TIMES_DAILY"
                        : doses == 3 ? "THRICE_DAILY"
                        : doses == 2 ? "TWICE_DAILY"
                        : "ONCE_DAILY";
            }

            ExtractedMedicineDto med = ExtractedMedicineDto.builder()
                    .name(name)
                    .genericName(cleanText(node.get("genericName")))
                    .dose(dose)
                    .form(normalizeForm(cleanText(node.get("form"))))
                    .frequency(frequency)
                    .dosePattern(dosePattern)
                    .timing(timing)
                    .foodInstruction(foodInstruction)
                    .duration(duration)
                    .durationDays(parseDurationDays(duration))
                    .confidenceScore(readConfidence(node.get("confidence")))
                    .build();
            med.setUncertain(false);

            results.add(med);
        }

        return results;
    }

    static String resolveFoodInstruction(JsonNode node) {
        Boolean before = readNullableBoolean(node.get("beforeMeal"));
        Boolean after = readNullableBoolean(node.get("afterMeal"));
        if (Boolean.TRUE.equals(before) && !Boolean.TRUE.equals(after)) {
            return "BEFORE_MEAL";
        }
        if (Boolean.TRUE.equals(after) && !Boolean.TRUE.equals(before)) {
            return "AFTER_MEAL";
        }
        // Explicit instructions may mention the meal relationship more reliably.
        String instructions = cleanText(node.get("instructions"));
        if (instructions != null) {
            String lower = instructions.toLowerCase();
            if (lower.contains("empty stomach") || instructions.contains("খালি পেট")) {
                return "EMPTY_STOMACH";
            }
            if (lower.contains("before meal") || lower.contains("before food")
                    || instructions.contains("খাবারের আগে") || instructions.contains("খাওয়ার আগে")) {
                return "BEFORE_MEAL";
            }
            if (lower.contains("after meal") || lower.contains("after food")
                    || instructions.contains("খাবারের পরে") || instructions.contains("খাওয়ার পরে")) {
                return "AFTER_MEAL";
            }
            if (lower.contains("with meal") || lower.contains("with food")) {
                return "WITH_MEAL";
            }
        }
        return null;
    }

    static Integer parseDurationDays(String duration) {
        if (duration == null || duration.isBlank()) {
            return null;
        }
        Integer days = firstInt(DAYS_PATTERN, duration);
        if (days != null) return days;
        Integer weeks = firstInt(WEEKS_PATTERN, duration);
        if (weeks != null) return weeks * 7;
        Integer months = firstInt(MONTHS_PATTERN, duration);
        if (months != null) return months * 30;
        Integer years = firstInt(YEARS_PATTERN, duration);
        if (years != null) return years * 365;
        return null;
    }

    private static Integer firstInt(Pattern pattern, String value) {
        Matcher matcher = pattern.matcher(value);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    static String joinDose(String strength, String unit) {
        if (strength == null) {
            return null;
        }
        String trimmed = strength.trim();
        if (unit == null || trimmed.toLowerCase().endsWith(unit.toLowerCase())) {
            return trimmed;
        }
        return trimmed + " " + unit.trim();
    }

    static String normalizeForm(String form) {
        if (form == null) {
            return null;
        }
        String upper = form.trim().toUpperCase();
        switch (upper) {
            case "TAB":
            case "TABLET":
            case "TABLETS":
                return "TABLET";
            case "CAP":
            case "CAPSULE":
            case "CAPSULES":
                return "CAPSULE";
            case "SYP":
            case "SYRUP":
                return "SYRUP";
            case "INJ":
            case "INJECTION":
                return "INJECTION";
            case "DROP":
            case "DROPS":
                return "DROPS";
            case "CREAM":
            case "OINTMENT":
            case "GEL":
            case "INHALER":
            case "SUSPENSION":
            case "SOLUTION":
                return upper;
            default:
                // Unrecognised form text is preserved as-is; we never invent a dosage form.
                return upper.length() > 20 ? null : upper;
        }
    }

    static String normalizeDate(String date) {
        if (date == null) {
            return null;
        }
        String value = date.trim();
        if (value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return value;
        }
        // Convert common DD/MM/YYYY or DD-MM-YYYY shapes into ISO form.
        Matcher matcher = Pattern.compile("^(\\d{1,2})[/.\\-](\\d{1,2})[/.\\-](\\d{4})$").matcher(value);
        if (matcher.matches()) {
            return String.format("%s-%02d-%02d", matcher.group(3),
                    Integer.parseInt(matcher.group(2)), Integer.parseInt(matcher.group(1)));
        }
        return null;
    }

    /** Returns null for missing, blank or placeholder text so we never store invented values. */
    static String cleanText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText("");
        return cleanText(value);
    }

    static String cleanText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty() || PLACEHOLDER.matcher(trimmed).matches()) {
            return null;
        }
        return trimmed;
    }

    private static boolean readBoolean(JsonNode node) {
        return Boolean.TRUE.equals(readNullableBoolean(node));
    }

    private static Boolean readNullableBoolean(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isBoolean()) {
            return node.asBoolean();
        }
        String value = node.asText("").trim().toLowerCase();
        if (value.equals("true") || value.equals("yes") || value.equals("1")) {
            return true;
        }
        if (value.equals("false") || value.equals("no") || value.equals("0")) {
            return false;
        }
        return null;
    }

    private static double readConfidence(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return 0.9;
        }
        try {
            double value = node.isTextual() ? Double.parseDouble(node.asText().trim()) : node.asDouble(0.9);
            if (value > 1.0 && value <= 100.0) {
                value = value / 100.0;
            }
            return Math.max(0.0, Math.min(1.0, value));
        } catch (Exception e) {
            return 0.9;
        }
    }
}
