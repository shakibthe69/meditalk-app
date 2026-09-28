package com.meditalk.services;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Seeds the curated hospital directory used by emergency assistance on first boot.
 */
@Component
@Order(2)
public class EmergencyDataInitializer implements CommandLineRunner {

    private final EmergencyService emergencyService;

    public EmergencyDataInitializer(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @Override
    public void run(String... args) {
        emergencyService.seedHospitalsIfEmpty();
    }
}
