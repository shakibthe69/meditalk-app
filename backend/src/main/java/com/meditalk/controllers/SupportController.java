package com.meditalk.controllers;

import com.meditalk.dto.AdminDtos;
import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.UserDto;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.UserRepository;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.AdminMonitoringService;
import com.meditalk.services.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Patient-facing side of the follow-up system.
 *
 * <ul>
 *   <li>{@code POST /api/help-requests} — "I need help": the type comes from
 *       the patient; the system never infers a medical emergency on its own.</li>
 *   <li>{@code GET /api/help-requests/mine} — transparency: patients can see
 *       the requests they sent and their status.</li>
 *   <li>{@code PUT /api/follow-up-consent} — explicit opt-in/out for automated
 *       medication follow-up calls (future AI voice). Never enabled silently.</li>
 * </ul>
 *
 * <p>All endpoints require a normal authenticated JWT — no admin rights.
 */
@RestController
public class SupportController {

    private final AdminMonitoringService monitoring;
    private final UserRepository userRepository;
    private final AuthService authService;

    public SupportController(AdminMonitoringService monitoring,
                             UserRepository userRepository,
                             AuthService authService) {
        this.monitoring = monitoring;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @PostMapping("/api/help-requests")
    public ResponseEntity<ApiResponse<AdminDtos.HelpRequest>> createHelpRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody AdminDtos.HelpRequestCreate request) {
        return ResponseEntity.ok(ApiResponse.success(
                monitoring.createHelpRequest(principal.getId(), request),
                "Your request has been sent to the Meditalk team"));
    }

    @GetMapping("/api/help-requests/mine")
    public ResponseEntity<ApiResponse<List<AdminDtos.HelpRequest>>> myHelpRequests(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.myHelpRequests(principal.getId())));
    }

    /** Consent toggle for automated medication follow-up calls (future feature). */
    @PutMapping("/api/follow-up-consent")
    public ResponseEntity<ApiResponse<UserDto>> setFollowUpConsent(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Boolean> body) {
        Boolean optIn = body != null ? body.get("followUpCallsOptIn") : null;
        if (optIn == null) {
            throw new BadRequestException("followUpCallsOptIn is required");
        }
        var user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setFollowUpCallsOptIn(optIn);
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(
                authService.getCurrentUser(user.getId()),
                optIn ? "Follow-up calls enabled" : "Follow-up calls disabled"));
    }
}
