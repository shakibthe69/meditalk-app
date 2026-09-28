package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.AuthResponse;
import com.meditalk.dto.DoctorRegistrationRequest;
import com.meditalk.dto.LoginRequest;
import com.meditalk.services.DoctorAuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public doctor authentication endpoints. These live under /api/auth/**,
 * which SecurityConfig already permits without a token.
 */
@RestController
@RequestMapping("/api/auth")
public class DoctorAuthController {

    private final DoctorAuthService doctorAuthService;

    public DoctorAuthController(DoctorAuthService doctorAuthService) {
        this.doctorAuthService = doctorAuthService;
    }

    @PostMapping("/register-doctor")
    public ResponseEntity<ApiResponse<AuthResponse>> registerDoctor(@Valid @RequestBody DoctorRegistrationRequest request) {
        AuthResponse response = doctorAuthService.registerDoctor(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Doctor registered successfully"));
    }

    @PostMapping("/login-doctor")
    public ResponseEntity<ApiResponse<AuthResponse>> loginDoctor(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = doctorAuthService.loginDoctor(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Doctor login successful"));
    }
}
