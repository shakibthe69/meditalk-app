package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.DoctorRequest;
import com.meditalk.dto.DoctorResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getDoctors(@AuthenticationPrincipal UserPrincipal principal) {
        List<DoctorResponse> doctors = doctorService.getDoctors(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(doctors));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id,
                                                                    @AuthenticationPrincipal UserPrincipal principal) {
        DoctorResponse doctor = doctorService.getDoctorById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(doctor));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(@AuthenticationPrincipal UserPrincipal principal,
                                                                   @Valid @RequestBody DoctorRequest request) {
        DoctorResponse doctor = doctorService.createDoctor(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(doctor, "Doctor added successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(@PathVariable Long id,
                                                                   @AuthenticationPrincipal UserPrincipal principal,
                                                                   @Valid @RequestBody DoctorRequest request) {
        DoctorResponse doctor = doctorService.updateDoctor(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(doctor, "Doctor updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDoctor(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        doctorService.deleteDoctor(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Doctor deleted successfully"));
    }
}
