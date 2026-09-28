package com.meditalk.services;

import com.meditalk.dto.EmergencyNumbersResponse;
import com.meditalk.dto.HospitalResponse;
import com.meditalk.entities.Hospital;
import com.meditalk.repositories.HospitalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Emergency assistance: predefined emergency numbers plus a curated
 * hospital directory fallback. True nearby lookup happens on-device
 * (GPS + OpenStreetMap); this service provides the vetted directory
 * and numbers so one-tap actions always have something to call.
 */
@Service
public class EmergencyService {

    private static final Logger log = LoggerFactory.getLogger(EmergencyService.class);

    /** National emergency numbers (Bangladesh). */
    private static final String PRIMARY_EMERGENCY = "999";
    private static final List<String> EMERGENCY_NUMBERS = List.of(
            "999",    // National Emergency (Police / Ambulance / Fire)
            "16263",  // Health advice line
            "10655"   // IEDCR health emergency
    );

    private final HospitalRepository hospitalRepository;

    public EmergencyService(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    public EmergencyNumbersResponse getEmergencyNumbers() {
        return EmergencyNumbersResponse.builder()
                .numbers(EMERGENCY_NUMBERS)
                .primaryNumber(PRIMARY_EMERGENCY)
                .build();
    }

    public List<HospitalResponse> getHospitals() {
        return hospitalRepository.findAllByOrderByNameAsc()
                .stream()
                .map(EmergencyService::mapToResponse)
                .collect(Collectors.toList());
    }

    public static HospitalResponse mapToResponse(Hospital h) {
        return HospitalResponse.builder()
                .id(h.getId())
                .name(h.getName())
                .address(h.getAddress())
                .phone(h.getPhone())
                .emergencyPhone(h.getEmergencyPhone())
                .latitude(h.getLatitude())
                .longitude(h.getLongitude())
                .build();
    }

    @Transactional
    public void seedHospitalsIfEmpty() {
        if (hospitalRepository.count() > 0) {
            return;
        }
        List<Hospital> seed = List.of(
                Hospital.builder().name("Dhaka Medical College Hospital")
                        .address("Secretariat Rd, Bakshibazar, Dhaka 1000")
                        .phone("+880 2-55615400").emergencyPhone("999")
                        .latitude(23.7259).longitude(90.3973).build(),
                Hospital.builder().name("Square Hospital Ltd")
                        .address("18/F Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205")
                        .phone("+880 2-8144466").emergencyPhone("10615")
                        .latitude(23.7509).longitude(90.3895).build(),
                Hospital.builder().name("United Hospital Limited")
                        .address("Plot 15, Rd 71, Gulshan 2, Dhaka 1212")
                        .phone("+880 2-8836000").emergencyPhone("19111361666")
                        .latitude(23.7925).longitude(90.4148).build(),
                Hospital.builder().name("Apollo/Evercare Hospital Dhaka")
                        .address("Plot 81, Block E, Bashundhara R/A, Dhaka 1229")
                        .phone("+880 2-55037242").emergencyPhone("10666")
                        .latitude(23.8133).longitude(90.4261).build(),
                Hospital.builder().name("Bangabandhu Sheikh Mujib Medical University")
                        .address("Shahbagh, Dhaka 1000")
                        .phone("+880 2-9661051").emergencyPhone("999")
                        .latitude(23.7383).longitude(90.3939).build(),
                Hospital.builder().name("Ibn Sina Hospital")
                        .address("House 48, Rd 9/A, Dhanmondi, Dhaka 1209")
                        .phone("+880 2-9126626").emergencyPhone("10615")
                        .latitude(23.7461).longitude(90.3742).build()
        );
        hospitalRepository.saveAll(seed);
        log.info("Seeded {} emergency hospitals", seed.size());
    }
}
