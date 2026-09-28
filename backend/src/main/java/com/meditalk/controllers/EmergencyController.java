package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.EmergencyNumbersResponse;
import com.meditalk.dto.HospitalResponse;
import com.meditalk.services.EmergencyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    private final EmergencyService emergencyService;

    public EmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @GetMapping("/numbers")
    public ResponseEntity<ApiResponse<EmergencyNumbersResponse>> getEmergencyNumbers() {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.getEmergencyNumbers()));
    }

    @GetMapping("/hospitals")
    public ResponseEntity<ApiResponse<List<HospitalResponse>>> getHospitals() {
        return ResponseEntity.ok(ApiResponse.success(emergencyService.getHospitals()));
    }
}
