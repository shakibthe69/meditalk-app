package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.MedicineRequest;
import com.meditalk.dto.MedicineResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.MedicineService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicineResponse>>> getMedicines(
            @RequestParam(required = false) Boolean activeOnly,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<MedicineResponse> medicines = medicineService.getAllMedicines(principal.getId(), activeOnly);
        return ResponseEntity.ok(ApiResponse.success(medicines));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineResponse>> getMedicineById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        MedicineResponse medicine = medicineService.getMedicineById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(medicine));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicineResponse>> createMedicine(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MedicineRequest request) {
        MedicineResponse medicine = medicineService.createMedicine(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(medicine, "Medicine created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineResponse>> updateMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MedicineRequest request) {
        MedicineResponse medicine = medicineService.updateMedicine(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(medicine, "Medicine updated successfully"));
    }

    @PatchMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<MedicineResponse>> toggleActive(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        MedicineResponse medicine = medicineService.toggleActive(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(medicine, "Medicine status toggled"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        medicineService.deleteMedicine(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Medicine deleted successfully"));
    }
}
