package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.PrescriptionRequest;
import com.meditalk.dto.PrescriptionResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PrescriptionResponse>>> getPrescriptions(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<PrescriptionResponse> list = prescriptionService.getPrescriptions(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PrescriptionResponse>> getPrescriptionById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        PrescriptionResponse prescription = prescriptionService.getPrescriptionById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(prescription));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PrescriptionResponse>> createPrescription(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PrescriptionRequest request) {
        PrescriptionResponse saved = prescriptionService.createPrescription(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(saved, "Prescription and medications saved successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePrescription(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        prescriptionService.deletePrescription(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Prescription deleted successfully"));
    }
}
