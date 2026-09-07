package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.MedicalReportRequest;
import com.meditalk.dto.MedicalReportResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.MedicalReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class MedicalReportController {

    private final MedicalReportService reportService;

    public MedicalReportController(MedicalReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicalReportResponse>>> getReports(
            @RequestParam(required = false) String type,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<MedicalReportResponse> reports = reportService.getReports(principal.getId(), type);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalReportResponse>> getReportById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        MedicalReportResponse report = reportService.getReportById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicalReportResponse>> createReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MedicalReportRequest request) {
        MedicalReportResponse report = reportService.createReport(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(report, "Medical report saved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicalReportResponse>> updateReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody MedicalReportRequest request) {
        MedicalReportResponse report = reportService.updateReport(id, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(report, "Medical report updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        reportService.deleteReport(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Medical report deleted successfully"));
    }
}
