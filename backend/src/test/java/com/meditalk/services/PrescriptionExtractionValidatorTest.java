package com.meditalk.services;

import com.meditalk.dto.ExtractedMedicineDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PrescriptionExtractionValidatorTest {

    @Test
    @DisplayName("1. Valid strict JSON is parsed into medicines")
    void testValidJson() {
        String json = "{\n" +
                "  \"patientName\": null,\n" +
                "  \"doctorName\": \"Dr. S. M. Rahman\",\n" +
                "  \"hospitalOrClinic\": \"Apollo Clinic\",\n" +
                "  \"prescriptionDate\": \"2026-09-20\",\n" +
                "  \"diagnosis\": \"Fever\",\n" +
                "  \"medicines\": [\n" +
                "    {\"medicineName\":\"Napa\",\"genericName\":\"Paracetamol\",\"strength\":\"500\",\"unit\":\"mg\"," +
                "\"dosage\":null,\"frequency\":null,\"morning\":true,\"afternoon\":false,\"evening\":false," +
                "\"night\":true,\"beforeMeal\":false,\"afterMeal\":true,\"duration\":\"5 days\"," +
                "\"form\":\"TAB\",\"instructions\":null,\"confidence\":0.9}\n" +
                "  ],\n" +
                "  \"notes\": null\n" +
                "}";

        PrescriptionExtractionValidator.ParsedPrescription parsed = PrescriptionExtractionValidator.parse(json);

        assertEquals("Dr. S. M. Rahman", parsed.getDoctorName());
        assertEquals("2026-09-20", parsed.getPrescriptionDate());
        assertNull(parsed.getPatientName());

        assertEquals(1, parsed.getMedicines().size());
        ExtractedMedicineDto med = parsed.getMedicines().get(0);
        assertEquals("Napa", med.getName());
        assertEquals("Paracetamol", med.getGenericName());
        assertEquals("500 mg", med.getDose());
        assertEquals("TABLET", med.getForm());
        assertEquals("1+0+0+1", med.getDosePattern());
        assertEquals(List.of("morning", "night"), med.getTiming());
        assertEquals("AFTER_MEAL", med.getFoodInstruction());
        assertEquals(5, med.getDurationDays());
    }

    @Test
    @DisplayName("2. JSON wrapped in prose / code fences is still parsed")
    void testFencedJson() {
        String json = "Here is the result:\n```json\n{\"medicines\":[{\"medicineName\":\"Seclo\"}]}\n```\nDone.";

        PrescriptionExtractionValidator.ParsedPrescription parsed = PrescriptionExtractionValidator.parse(json);

        assertEquals(1, parsed.getMedicines().size());
        assertEquals("Seclo", parsed.getMedicines().get(0).getName());
    }

    @Test
    @DisplayName("3. Malformed JSON is rejected so nothing invalid reaches the database")
    void testMalformedJsonRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> PrescriptionExtractionValidator.parse("{\"medicines\": ["));
        assertThrows(IllegalArgumentException.class,
                () -> PrescriptionExtractionValidator.parse("I could not read this prescription."));
        assertThrows(IllegalArgumentException.class,
                () -> PrescriptionExtractionValidator.parse(""));
    }

    @Test
    @DisplayName("4. Medicines without a readable name are dropped, never invented")
    void testUnnamedMedicineSkipped() {
        String json = "{\"medicines\":[" +
                "{\"medicineName\":null,\"strength\":\"500mg\"}," +
                "{\"medicineName\":\"  \",\"strength\":\"20mg\"}," +
                "{\"medicineName\":\"unknown\"}," +
                "{\"medicineName\":\"Napa Extra\"}]}";

        PrescriptionExtractionValidator.ParsedPrescription parsed = PrescriptionExtractionValidator.parse(json);

        assertEquals(1, parsed.getMedicines().size());
        assertEquals("Napa Extra", parsed.getMedicines().get(0).getName());
    }

    @Test
    @DisplayName("5. Missing dosage and schedule stay null/false instead of being guessed")
    void testMissingValuesStayEmpty() {
        String json = "{\"medicines\":[{\"medicineName\":\"Unclear Drug\"," +
                "\"strength\":null,\"unit\":null,\"dosage\":null," +
                "\"morning\":false,\"afternoon\":false,\"evening\":false,\"night\":false," +
                "\"beforeMeal\":null,\"afterMeal\":null,\"duration\":null,\"form\":null}]}";

        PrescriptionExtractionValidator.ParsedPrescription parsed = PrescriptionExtractionValidator.parse(json);
        ExtractedMedicineDto med = parsed.getMedicines().get(0);

        assertNull(med.getDose());
        assertNull(med.getDuration());
        assertNull(med.getDurationDays());
        assertNull(med.getFoodInstruction());
        assertNull(med.getDosePattern());
        assertTrue(med.getTiming().isEmpty(), "no schedule was stated, so no timing slots may be invented");
        assertNull(med.getForm(), "an unknown dosage form must not default to TABLET");
    }

    @Test
    @DisplayName("6. Placeholder strings are treated as missing values")
    void testPlaceholdersTreatedAsMissing() {
        String json = "{\"doctorName\":\"N/A\",\"hospitalOrClinic\":\"unknown\",\"diagnosis\":\"-\"," +
                "\"prescriptionDate\":\"unreadable\"," +
                "\"medicines\":[{\"medicineName\":\"Napa\",\"genericName\":\"N/A\",\"strength\":\"\"," +
                "\"unit\":\"\",\"duration\":\"not mentioned\"}]}";

        PrescriptionExtractionValidator.ParsedPrescription parsed = PrescriptionExtractionValidator.parse(json);

        assertNull(parsed.getDoctorName());
        assertNull(parsed.getHospitalOrClinic());
        assertNull(parsed.getDiagnosis());
        assertNull(parsed.getPrescriptionDate());

        ExtractedMedicineDto med = parsed.getMedicines().get(0);
        assertNull(med.getGenericName());
        assertNull(med.getDose());
        assertNull(med.getDuration());
    }

    @Test
    @DisplayName("7. Schedule counts map to the correct frequency")
    void testFrequencyDerivation() {
        String json = "{\"medicines\":[" +
                "{\"medicineName\":\"A\",\"morning\":true,\"afternoon\":true,\"evening\":true,\"night\":true}," +
                "{\"medicineName\":\"B\",\"morning\":true,\"afternoon\":true,\"evening\":true}," +
                "{\"medicineName\":\"C\",\"morning\":true,\"night\":true}," +
                "{\"medicineName\":\"D\",\"morning\":true}]}";

        List<ExtractedMedicineDto> meds = PrescriptionExtractionValidator.parse(json).getMedicines();

        assertEquals("FOUR_TIMES_DAILY", meds.get(0).getFrequency());
        assertEquals("1+1+1+1", meds.get(0).getDosePattern());
        assertEquals("THRICE_DAILY", meds.get(1).getFrequency());
        assertEquals("TWICE_DAILY", meds.get(2).getFrequency());
        assertEquals("ONCE_DAILY", meds.get(3).getFrequency());
    }

    @Test
    @DisplayName("8. Bangladeshi date formats are normalised, junk dates are dropped")
    void testDateNormalisation() {
        PrescriptionExtractionValidator.ParsedPrescription parsed =
                PrescriptionExtractionValidator.parse("{\"prescriptionDate\":\"15/09/2026\"}");
        assertEquals("2026-09-15", parsed.getPrescriptionDate());

        PrescriptionExtractionValidator.ParsedPrescription invalid =
                PrescriptionExtractionValidator.parse("{\"prescriptionDate\":\"last week\"}");
        assertNull(invalid.getPrescriptionDate());
    }

    @Test
    @DisplayName("9. Duration parsing handles days, weeks and months")
    void testDurationParsing() {
        assertEquals(10, PrescriptionExtractionValidator.parseDurationDays("10 days"));
        assertEquals(21, PrescriptionExtractionValidator.parseDurationDays("3 weeks"));
        assertEquals(60, PrescriptionExtractionValidator.parseDurationDays("2 months"));
        assertEquals(14, PrescriptionExtractionValidator.parseDurationDays("১৪ দিন".replace("১৪", "14")));
        assertNull(PrescriptionExtractionValidator.parseDurationDays("continue as needed"));
    }
}
