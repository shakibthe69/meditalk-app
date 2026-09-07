package com.meditalk.controllers;

import com.meditalk.dto.AdherenceStatsDto;
import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.MedicineLogRequest;
import com.meditalk.dto.MedicineLogResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.MedicineLogService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicine-logs")
public class MedicineLogController {

    private final MedicineLogService logService;

    public MedicineLogController(MedicineLogService logService) {
        this.logService = logService;
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<MedicineLogResponse>>> getTodayLogs(@AuthenticationPrincipal UserPrincipal principal) {
        List<MedicineLogResponse> logs = logService.getTodayLogs(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/adherence")
    public ResponseEntity<ApiResponse<AdherenceStatsDto>> getAdherenceStats(@AuthenticationPrincipal UserPrincipal principal) {
        AdherenceStatsDto stats = logService.getAdherenceStats(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicineLogResponse>> recordDose(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MedicineLogRequest request) {
        MedicineLogResponse log = logService.recordDose(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(log, "Dose recorded successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MedicineLogResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal principal) {
        MedicineLogResponse updated = logService.updateLogStatus(id, principal.getId(), status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Dose status updated to " + status));
    }
}
