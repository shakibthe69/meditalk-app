package com.meditalk.controllers;

import com.meditalk.dto.AdminDtos;
import com.meditalk.dto.ApiResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.AdminMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Panel API.
 *
 * <p>Every endpoint is double-guarded: the security filter chain requires
 * ROLE_ADMIN for {@code /api/admin/**} and each method carries
 * {@code @PreAuthorize("hasRole('ADMIN')")}, so patient monitoring data can
 * never leak to normal users even if the matcher is edited.
 *
 * <p>Inactivity and medication counts exposed here are follow-up signals —
 * admins review context and record outcomes; nothing is a diagnosis.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminMonitoringService monitoring;

    public AdminController(AdminMonitoringService monitoring) {
        this.monitoring = monitoring;
    }

    // ---------- Dashboard ----------

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDtos.Dashboard>> dashboard() {
        return ResponseEntity.ok(ApiResponse.success(monitoring.dashboard()));
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<AdminDtos.Thresholds>> settings() {
        return ResponseEntity.ok(ApiResponse.success(monitoring.thresholds()));
    }

    // ---------- Patient monitoring ----------

    @GetMapping("/patients")
    public ResponseEntity<ApiResponse<List<AdminDtos.PatientSummary>>> patients(@ModelAttribute AdminDtos.PatientQuery query) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.listPatients(query)));
    }

    @GetMapping("/patients/inactive")
    public ResponseEntity<ApiResponse<List<AdminDtos.PatientSummary>>> inactivePatients() {
        return ResponseEntity.ok(ApiResponse.success(monitoring.listInactive()));
    }

    @GetMapping("/medication-adherence")
    public ResponseEntity<ApiResponse<List<AdminDtos.PatientSummary>>> medicationAdherence() {
        return ResponseEntity.ok(ApiResponse.success(monitoring.listAdherence()));
    }

    @GetMapping("/patients/{id}")
    public ResponseEntity<ApiResponse<AdminDtos.PatientDetail>> patientDetail(@PathVariable Long id,
                                                                             @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.patientDetail(id, principal.getId())));
    }

    @GetMapping("/patients/{id}/activity")
    public ResponseEntity<ApiResponse<AdminDtos.Activity>> patientActivity(@PathVariable Long id,
                                                                          @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.patientActivity(id, principal.getId())));
    }

    @GetMapping("/patients/{id}/medications")
    public ResponseEntity<ApiResponse<List<AdminDtos.Medication>>> patientMedications(@PathVariable Long id,
                                                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.patientMedications(id, principal.getId())));
    }

    // ---------- Notes & notifications ----------

    @PostMapping("/patients/{id}/notes")
    public ResponseEntity<ApiResponse<AdminDtos.Note>> addNote(@PathVariable Long id,
                                                               @RequestBody AdminDtos.NoteRequest request,
                                                               @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                monitoring.addNote(id, request.getBody(), principal.getId()), "Note added"));
    }

    @PostMapping("/patients/{id}/notification")
    public ResponseEntity<ApiResponse<AdminDtos.Contact>> sendNotification(@PathVariable Long id,
                                                                           @RequestBody AdminDtos.NotificationRequest request,
                                                                           @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                monitoring.sendNotification(id, request, principal.getId()), "Notification sent"));
    }

    // ---------- Follow-up queue ----------

    @GetMapping("/follow-ups")
    public ResponseEntity<ApiResponse<List<AdminDtos.FollowUp>>> followUps(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.listFollowUps(status)));
    }

    @PostMapping("/follow-ups/{id}/contact")
    public ResponseEntity<ApiResponse<AdminDtos.FollowUp>> contact(@PathVariable Long id,
                                                                   @RequestBody AdminDtos.ContactRequest request,
                                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                monitoring.contactPatient(id, request, principal.getId()), "Contact recorded"));
    }

    @PostMapping("/follow-ups/{id}/resolve")
    public ResponseEntity<ApiResponse<AdminDtos.FollowUp>> resolve(@PathVariable Long id,
                                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                monitoring.resolveFollowUp(id, principal.getId()), "Follow-up resolved"));
    }

    // ---------- Help / emergency requests ----------

    @GetMapping("/help-requests")
    public ResponseEntity<ApiResponse<List<AdminDtos.HelpRequest>>> helpRequests(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.listHelpRequests(status)));
    }

    @PatchMapping("/help-requests/{id}")
    public ResponseEntity<ApiResponse<AdminDtos.HelpRequest>> updateHelpRequest(@PathVariable Long id,
                                                                                @RequestBody AdminDtos.HelpStatusRequest request,
                                                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(
                monitoring.updateHelpRequest(id, request, principal.getId()), "Help request updated"));
    }

    // ---------- Reports ----------

    @GetMapping("/reports/adherence")
    public ResponseEntity<ApiResponse<AdminDtos.AdherenceReport>> adherenceReport(@ModelAttribute AdminDtos.ReportQuery query) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.adherenceReport(query)));
    }

    @GetMapping("/reports/activity")
    public ResponseEntity<ApiResponse<AdminDtos.ActivityReport>> activityReport(@ModelAttribute AdminDtos.ReportQuery query) {
        return ResponseEntity.ok(ApiResponse.success(monitoring.activityReport(query)));
    }

    // ---------- Audit ----------

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AdminDtos.AuditEntry>>> auditLogs() {
        return ResponseEntity.ok(ApiResponse.success(monitoring.auditLog()));
    }
}
