package com.meditalk.services;

import com.meditalk.dto.MedicineResponse;
import com.meditalk.dto.MedicineScheduleDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HealthChatContextServiceTest {

    /** Minimal stub — a plain subclass avoids bytecode mocking on newer JDKs. */
    private static class StubMedicineService extends MedicineService {
        private final List<MedicineResponse> medicines;
        private final RuntimeException failure;

        StubMedicineService(List<MedicineResponse> medicines) {
            super(null, null, null, null, null);
            this.medicines = medicines;
            this.failure = null;
        }

        StubMedicineService(RuntimeException failure) {
            super(null, null, null, null, null);
            this.medicines = List.of();
            this.failure = failure;
        }

        @Override
        public List<MedicineResponse> getAllMedicines(Long userId, Boolean activeOnly) {
            if (failure != null) {
                throw failure;
            }
            return medicines;
        }
    }

    @Test
    @DisplayName("No user id or no medicines yields no context")
    void testEmptyContext() {
        assertNull(new HealthChatContextService(new StubMedicineService(List.of()))
                .buildMedicationContext((Long) null));
        assertNull(new HealthChatContextService(new StubMedicineService(List.of())).buildMedicationContext(7L));
    }

    @Test
    @DisplayName("Confirmed medicines are summarised without raw prescription text")
    void testContextIncludesConfirmedMedicinesOnly() {
        HealthChatContextService contextService = new HealthChatContextService(
                new StubMedicineService(List.of(medicine())));

        String context = contextService.buildMedicationContext(7L);

        assertNotNull(context);
        assertTrue(context.contains("Napa"));
        assertTrue(context.contains("500mg"));
        assertTrue(context.contains("thrice daily"));
        assertTrue(context.contains("after meal"));
        assertTrue(context.contains("08:00 AM"));
        assertTrue(context.contains("duration 5 days"));
        assertFalse(context.toLowerCase().contains("ocr"));
    }

    @Test
    @DisplayName("A failing lookup never breaks the chat")
    void testLookupFailureReturnsNull() {
        HealthChatContextService contextService = new HealthChatContextService(
                new StubMedicineService(new IllegalStateException("db down")));

        assertNull(contextService.buildMedicationContext(7L));
    }

    private MedicineResponse medicine() {
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
                .createdAt(LocalDateTime.now())
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
