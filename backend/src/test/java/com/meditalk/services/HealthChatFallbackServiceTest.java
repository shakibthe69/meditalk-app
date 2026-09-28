package com.meditalk.services;

import com.meditalk.dto.MedicineResponse;
import com.meditalk.dto.MedicineScheduleDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HealthChatFallbackServiceTest {

    private final HealthChatFallbackService service = new HealthChatFallbackService();

    @Test
    @DisplayName("1. Emergency symptoms always escalate, in both languages")
    void testEmergencyEscalation() {
        HealthChatFallbackService.Answer en = service.answer("I have chest pain and cannot breathe", "en", List.of());
        assertTrue(en.isEmergency());
        assertTrue(en.getText().toLowerCase().contains("emergency"));
        assertTrue(en.getTopic().equals("emergency"));

        HealthChatFallbackService.Answer bn = service.answer("আমার বুকে ব্যথা এবং শ্বাসকষ্ট হচ্ছে", "bn", List.of());
        assertTrue(bn.isEmergency(), "Bangla emergency terms must escalate too");
    }

    @Test
    @DisplayName("2. 'What medicines am I taking?' is answered from confirmed records")
    void testMedicineListAnswer() {
        HealthChatFallbackService.Answer answer = service.answer(
                "What medicines am I taking?", "en", List.of(napa()));

        assertFalse(answer.isEmergency());
        assertEquals("my-medicines", answer.getTopic());
        assertTrue(answer.getText().contains("Napa"));
        assertTrue(answer.getText().contains("500mg"));
        assertTrue(answer.getText().contains("08:00 AM"), "scheduled times should be listed");
        assertTrue(answer.getText().contains("10:00 PM"));
    }

    @Test
    @DisplayName("3. With no saved medicines the answer says so instead of inventing one")
    void testMedicineListWithoutRecords() {
        HealthChatFallbackService.Answer answer = service.answer("my medicines?", "en", List.of());

        assertTrue(answer.getText().toLowerCase().contains("no active medicines"));
        assertFalse(answer.getText().toLowerCase().contains("napa"));
    }

    @Test
    @DisplayName("4. Bangla medicine question is answered in Bangla")
    void testBanglaMedicineQuestion() {
        HealthChatFallbackService.Answer answer = service.answer("আমার ওষুধ কী কী?", "bn", List.of(napa()));

        assertEquals("my-medicines", answer.getTopic());
        assertTrue(answer.getText().contains("Napa"));
        assertTrue(answer.getText().contains("নিশ্চিত"), "Bangla answer expected");
    }

    @Test
    @DisplayName("5. Common symptoms return the matching bilingual topic")
    void testSymptomTopics() {
        assertEquals("fever", service.answer("I have fever and chills", "en", List.of()).getTopic());
        assertEquals("stomach-acidity", service.answer("stomach pain since last night", "en", List.of()).getTopic());
        assertEquals("cough-cold", service.answer("sore throat and cough", "en", List.of()).getTopic());
        assertEquals("fever", service.answer("আমার জ্বর আছে", "bn", List.of()).getTopic());
    }

    @Test
    @DisplayName("6. General medicine-usage questions include the patient's own times")
    void testUsageAnswerWithTimes() {
        HealthChatFallbackService.Answer answer =
                service.answer("How should I take my medicine?", "en", List.of(napa()));

        assertEquals("medicine-usage", answer.getTopic());
        assertTrue(answer.getText().contains("Napa"));
        assertTrue(answer.getText().contains("08:00 AM"));
        assertTrue(answer.getText().toLowerCase().contains("antibiotic"));
    }

    @Test
    @DisplayName("7. Unknown questions get a clarifying answer, never a diagnosis")
    void testUnknownQuestion() {
        HealthChatFallbackService.Answer answer =
                service.answer("zzz something random", "en", List.of());

        assertEquals("general", answer.getTopic());
        assertTrue(answer.getText().toLowerCase().contains("do not diagnose"));
    }

    @Test
    @DisplayName("8. Knowledge base is emergency-aware and prefers the most specific match")
    void testKnowledgeBaseMatching() {
        assertTrue(HealthKnowledgeBase.isEmergency("sudden weakness on one side"));
        assertFalse(HealthKnowledgeBase.isEmergency("mild sore throat"));

        assertEquals("stomach-acidity",
                HealthKnowledgeBase.find("sharp stomach pain after eating").orElseThrow().getTopic());
        assertEquals("joint-back-pain",
                HealthKnowledgeBase.find("my knee pain is worse today").orElseThrow().getTopic());
        assertTrue(HealthKnowledgeBase.find("totally unrelated words").isEmpty());
        assertFalse(HealthKnowledgeBase.topics().isEmpty());
    }

    @Test
    @DisplayName("9. Bilingual content is complete and uses the correct scripts")
    void testKnowledgeBaseContentIntegrity() {
        assertFalse(HealthKnowledgeBase.allEntries().isEmpty());

        // Guards against a mixed-script typo slipping into the Bangla text.
        for (HealthKnowledgeBase.Entry entry : HealthKnowledgeBase.allEntries()) {
            assertFalse(entry.getKeys().isEmpty(), "no trigger keywords for " + entry.getTopic());
            assertNotNull(entry.getEn(), "missing English text for " + entry.getTopic());
            assertNotNull(entry.getBn(), "missing Bangla text for " + entry.getTopic());
            assertFalse(entry.getEn().isBlank(), "blank English text for " + entry.getTopic());
            assertFalse(entry.getBn().isBlank(), "blank Bangla text for " + entry.getTopic());
            assertFalse(containsNonBengaliIndicScript(entry.getBn()),
                    "Bangla text for " + entry.getTopic() + " contains characters from another Indic script");
        }
    }

    private boolean containsNonBengaliIndicScript(String value) {
        for (char c : value.toCharArray()) {
            // U+0964 / U+0965 are the script-neutral danda marks shared by Bengali, so
            // they are legitimate here. Any other Devanagari, Gurmukhi, Gujarati or
            // Oriya glyph inside a Bangla string means the text was corrupted.
            if (c == '\u0964' || c == '\u0965') continue;
            if (c >= '\u0900' && c <= '\u097F') return true;
            if (c >= '\u0A00' && c <= '\u0A7F') return true;
            if (c >= '\u0A80' && c <= '\u0AFF') return true;
            if (c >= '\u0B00' && c <= '\u0B7F') return true;
        }
        return false;
    }

    private MedicineResponse napa() {
        return MedicineResponse.builder()
                .id(1L)
                .userId(7L)
                .name("Napa")
                .dose("500mg")
                .form("TABLET")
                .frequency("THRICE_DAILY")
                .foodInstruction("AFTER_MEAL")
                .startDate(LocalDate.now())
                .durationDays(5)
                .isActive(true)
                .schedules(List.of(
                        schedule("08:00 AM"),
                        schedule("02:00 PM"),
                        schedule("10:00 PM")))
                .build();
    }

    private MedicineScheduleDto schedule(String time) {
        return MedicineScheduleDto.builder()
                .time(time)
                .label("MORNING")
                .dosageAmount("1 Tablet")
                .foodInstruction("AFTER_MEAL")
                .isEnabled(true)
                .build();
    }
}
