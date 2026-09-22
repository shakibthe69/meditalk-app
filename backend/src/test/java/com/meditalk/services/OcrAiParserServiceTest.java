package com.meditalk.services;

import com.meditalk.dto.ExtractedMedicineDto;
import com.meditalk.dto.OcrParseResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OcrAiParserServiceTest {

    private OcrAiParserService parserService;

    @BeforeEach
    void setUp() {
        parserService = new OcrAiParserService();
    }

    @Test
    @DisplayName("1. Clear English prescription with 1+1+1 pattern")
    void testClearEnglishPrescriptionWith111() {
        String rawText = "Dr. John Doe, MD\n" +
                "City General Hospital\n" +
                "Date: 2026-09-20\n" +
                "Rx\n" +
                "1. Tab. Napa 500mg\n" +
                "   1+1+1 - After meal - For 5 days\n";

        OcrParseResponse response = parserService.parsePrescriptionTextWithMetadata(
                rawText, "/uploads/sample.png", List.of("en"), 0.95, "Preprocessed"
        );

        assertEquals("Dr. John Doe", response.getDoctorName());
        assertTrue(response.getHospitalOrClinic().contains("Hospital"));
        assertEquals(1, response.getMedicines().size());

        ExtractedMedicineDto med = response.getMedicines().get(0);
        assertTrue(med.getName().contains("Napa"));
        assertEquals("500mg", med.getDose());
        assertEquals("1+1+1", med.getDosePattern());
        assertEquals("THRICE_DAILY", med.getFrequency());
        assertEquals("AFTER_MEAL", med.getFoodInstruction());
        assertEquals(5, med.getDurationDays());
        assertEquals(3, med.getSchedules().size());
        assertEquals("08:00 AM", med.getSchedules().get(0).getTime());
        assertEquals("02:00 PM", med.getSchedules().get(1).getTime());
        assertEquals("10:00 PM", med.getSchedules().get(2).getTime());
    }

    @Test
    @DisplayName("2. Clear Bangla prescription with ১+০+১ pattern and খাবারের পরে")
    void testBanglaPrescriptionWith101() {
        String rawText = "ডাঃ মোঃ রফিকুল ইসলাম\n" +
                "ঢাকা সেন্ট্রাল হাসপাতাল\n" +
                "তারিখ: ২০২৬-০৯-১৫\n" +
                "Rx\n" +
                "১. ট্যাব. নাপা ৫০০ মি.গ্রা.\n" +
                "   ১+০+১ - খাবারের পরে - ৭ দিন\n";

        OcrParseResponse response = parserService.parsePrescriptionTextWithMetadata(
                rawText, "/uploads/bangla.png", List.of("bn"), 0.93, "Grayscale + Sharpened"
        );

        assertTrue(response.getDoctorName().contains("রফিকুল"));
        assertEquals(1, response.getMedicines().size());

        ExtractedMedicineDto med = response.getMedicines().get(0);
        assertTrue(med.getName().contains("নাপা"));
        assertEquals("1+0+1", med.getDosePattern());
        assertEquals("TWICE_DAILY", med.getFrequency());
        assertEquals("AFTER_MEAL", med.getFoodInstruction());
        assertEquals(7, med.getDurationDays());
        assertEquals(2, med.getSchedules().size());
    }

    @Test
    @DisplayName("3. Mixed Bangla + English prescription with before meal and duration")
    void testMixedBanglaEnglishPrescription() {
        String rawText = "Dr. A. K. Azad, MBBS\n" +
                "Apex Clinic & Diagnostic\n" +
                "1. Cap. Omeprazole 20mg\n" +
                "   1+0+0 - খাবারের আগে (Before meal) - 14 days\n" +
                "2. Tab. Ciprocin 500mg\n" +
                "   1+0+1 - খাবারের পরে - 7 days\n";

        OcrParseResponse response = parserService.parsePrescriptionTextWithMetadata(
                rawText, "/uploads/mixed.png", List.of("en", "bn"), 0.94, "Complete"
        );

        assertEquals(2, response.getMedicines().size());

        ExtractedMedicineDto med1 = response.getMedicines().get(0);
        assertTrue(med1.getName().contains("Omeprazole"));
        assertEquals("CAPSULE", med1.getForm());
        assertEquals("20mg", med1.getDose());
        assertEquals("BEFORE_MEAL", med1.getFoodInstruction());
        assertEquals("1+0+0", med1.getDosePattern());
        assertEquals(14, med1.getDurationDays());

        ExtractedMedicineDto med2 = response.getMedicines().get(1);
        assertTrue(med2.getName().contains("Ciprocin"));
        assertEquals("TABLET", med2.getForm());
        assertEquals("500mg", med2.getDose());
        assertEquals("AFTER_MEAL", med2.getFoodInstruction());
        assertEquals("1+0+1", med2.getDosePattern());
        assertEquals(7, med2.getDurationDays());
    }

    @Test
    @DisplayName("4. Frequency pattern 0+1+0 and 1-0-1 recognition")
    void testVariousFrequencyPatterns() {
        String rawText = "1. Tab. Montene 10mg\n" +
                "   0+0+1 - রাতে খাবারের পরে - 1 month\n" +
                "2. Syrup Tusca 100ml\n" +
                "   0+1+0 - After meal - 5 days\n";

        List<ExtractedMedicineDto> meds = parserService.extractMedicines(rawText);
        assertEquals(2, meds.size());

        assertEquals("0+0+1", meds.get(0).getDosePattern());
        assertEquals(30, meds.get(0).getDurationDays());

        assertEquals("0+1+0", meds.get(1).getDosePattern());
        assertEquals("SYRUP", meds.get(1).getForm());
    }

    @Test
    @DisplayName("5. Empty Stomach / খালি পেটে meal instruction")
    void testEmptyStomachInstruction() {
        String rawText = "1. Cap. Pantonix 40mg\n" +
                "   1+0+0 - খালি পেটে (Empty stomach) - 30 days\n";

        List<ExtractedMedicineDto> meds = parserService.extractMedicines(rawText);
        assertEquals(1, meds.size());
        assertEquals("EMPTY_STOMACH", meds.get(0).getFoodInstruction());
    }

    @Test
    @DisplayName("6. Uncertain medicine name handling preserves text")
    void testUncertainMedicineName() {
        String rawText = "1. UnknownMedName 250mg\n" +
                "   1+0+1 - After meal - 3 days\n";

        List<ExtractedMedicineDto> meds = parserService.extractMedicines(rawText);
        assertEquals(1, meds.size());
        assertEquals("UnknownMedName", meds.get(0).getName());
        assertFalse(meds.get(0).getName().isBlank());
    }
}
