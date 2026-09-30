package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.MedicineInfoResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.MedicineInformationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * General (educational) medicine information.
 *
 * <p>Strictly additive: this endpoint only serves general drug-label data from
 * trusted sources. It never modifies prescription or reminder data. The user
 * must still be authenticated, so one patient can never probe another's data
 * through it.</p>
 */
@RestController
@RequestMapping("/api/medicines")
public class MedicineInformationController {

    private final MedicineInformationService medicineInformationService;

    public MedicineInformationController(MedicineInformationService medicineInformationService) {
        this.medicineInformationService = medicineInformationService;
    }

    /**
     * GET /api/medicines/info?name=Napa 500
     *
     * <p>Returns general, educational medicine information normalized from
     * DailyMed / openFDA. {@code found=false} means no reliable information
     * could be located — MediTalk never invents medical content.</p>
     */
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<MedicineInfoResponse>> getMedicineInfo(
            @RequestParam("name") String name,
            @AuthenticationPrincipal UserPrincipal principal) {

        MedicineInformationService.MedicineInfo info = medicineInformationService.getMedicineInfo(name);

        MedicineInfoResponse response = MedicineInfoResponse.builder()
                .queriedName(info.queriedName)
                .brandName(info.brandName)
                .genericName(info.genericName)
                .strength(info.strength)
                .dosageForm(info.dosageForm)
                .description(info.description)
                .uses(info.uses)
                .dosageInformation(info.dosageInformation)
                .sideEffects(info.sideEffects)
                .warnings(info.warnings)
                .contraindications(info.contraindications)
                .interactions(info.interactions)
                .storage(info.storage)
                .source(info.source)
                .sourceUrl(info.sourceUrl)
                .lastUpdated(info.lastUpdated)
                .price(info.price)
                .priceNote(info.priceNote)
                .disclaimer(info.disclaimer)
                .found(info.found)
                .cached(info.cached)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
