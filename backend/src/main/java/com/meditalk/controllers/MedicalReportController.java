package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.MedicalReportRequest;
import com.meditalk.dto.MedicalReportResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.MedicalReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    /**
     * Serves the report image stored in the database. The bytes are returned
     * verbatim — no re-encoding — so the patient always sees the exact image
     * they uploaded.
     */
    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> getReportFile(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        byte[] data = reportService.getReportFile(id, principal.getId());
        if (data == null || data.length == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(sniffMediaType(data))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(data);
    }

    private static MediaType sniffMediaType(byte[] data) {
        if (data.length >= 3 && (data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8) {
            return MediaType.IMAGE_JPEG;
        }
        if (data.length >= 8 && (data[0] & 0xFF) == 0x89 && data[1] == 'P' && data[2] == 'N' && data[3] == 'G') {
            return MediaType.IMAGE_PNG;
        }
        if (data.length >= 4 && data[0] == 'G' && data[1] == 'I' && data[2] == 'F') {
            return MediaType.IMAGE_GIF;
        }
        if (data.length >= 4 && data[0] == '%' && data[1] == 'P' && data[2] == 'D' && data[3] == 'F') {
            return MediaType.APPLICATION_PDF;
        }
        return MediaType.APPLICATION_OCTET_STREAM;
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
