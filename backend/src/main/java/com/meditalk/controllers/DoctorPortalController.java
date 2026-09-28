package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.DoctorAccountResponse;
import com.meditalk.dto.DoctorMessageRequest;
import com.meditalk.dto.DoctorMessageResponse;
import com.meditalk.dto.DoctorPostRequest;
import com.meditalk.dto.DoctorPostResponse;
import com.meditalk.dto.DoctorProfileUpdateRequest;
import com.meditalk.dto.DoctorStatusRequest;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.DoctorPortalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class DoctorPortalController {

    private final DoctorPortalService doctorPortalService;

    public DoctorPortalController(DoctorPortalService doctorPortalService) {
        this.doctorPortalService = doctorPortalService;
    }

    // ---------- Doctor-only endpoints ----------

    @GetMapping("/api/doctor-portal/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorAccountResponse>> getMyAccount(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(doctorPortalService.getMyAccount(principal.getId())));
    }

    @PutMapping("/api/doctor-portal/availability")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorAccountResponse>> setAvailability(@AuthenticationPrincipal UserPrincipal principal,
                                                                              @Valid @RequestBody DoctorStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorPortalService.setAvailability(principal.getId(), request.getIsAvailable()),
                "Availability updated"));
    }

    @PutMapping("/api/doctor-portal/profile")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorAccountResponse>> updateMyProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                                             @RequestBody DoctorProfileUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorPortalService.updateMyProfile(principal.getId(), request),
                "Profile updated"));
    }

    @GetMapping("/api/doctor-portal/patients")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPatientThreads(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(doctorPortalService.getPatientThreads(principal.getId())));
    }

    @GetMapping("/api/doctor-portal/patients/{patientId}/messages")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<List<DoctorMessageResponse>>> getThread(@PathVariable Long patientId,
                                                                              @AuthenticationPrincipal UserPrincipal principal) {
        doctorPortalService.markThreadReadForDoctor(principal.getId(), patientId);
        return ResponseEntity.ok(ApiResponse.success(doctorPortalService.getThread(principal.getId(), patientId)));
    }

    @PostMapping("/api/doctor-portal/messages")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorMessageResponse>> sendMessage(@AuthenticationPrincipal UserPrincipal principal,
                                                                          @Valid @RequestBody DoctorMessageRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorPortalService.sendMessage(principal.getId(), request), "Message sent"));
    }

    @GetMapping("/api/doctor-portal/posts")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<List<DoctorPostResponse>>> getMyPosts(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(doctorPortalService.getMyPosts(principal.getId())));
    }

    @PostMapping("/api/doctor-portal/posts")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorPostResponse>> createPost(@AuthenticationPrincipal UserPrincipal principal,
                                                                      @Valid @RequestBody DoctorPostRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorPortalService.createPost(principal.getId(), request), "Post published"));
    }

    @DeleteMapping("/api/doctor-portal/posts/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<Void>> deletePost(@PathVariable Long id,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        doctorPortalService.deletePost(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Post deleted successfully"));
    }

    // ---------- Patient-facing endpoints (any authenticated user) ----------

    @GetMapping("/api/doctor-posts")
    public ResponseEntity<ApiResponse<List<DoctorPostResponse>>> getAllPosts() {
        return ResponseEntity.ok(ApiResponse.success(doctorPortalService.getAllPosts()));
    }

    @GetMapping("/api/doctor-messages/inbox")
    public ResponseEntity<ApiResponse<List<DoctorMessageResponse>>> getMyInbox(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(doctorPortalService.getMyInbox(principal.getId())));
    }

    @GetMapping("/api/doctor-messages/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(doctorPortalService.getUnreadCount(principal.getId())));
    }

    @PostMapping("/api/doctor-messages")
    public ResponseEntity<ApiResponse<DoctorMessageResponse>> sendPatientMessage(@AuthenticationPrincipal UserPrincipal principal,
                                                                                 @Valid @RequestBody DoctorMessageRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                doctorPortalService.sendPatientMessage(principal.getId(), request), "Message sent"));
    }

    /** Open the patient's chat with a doctor: marks that doctor's messages read. */
    @GetMapping("/api/doctor-messages/thread/{doctorAccountId}")
    public ResponseEntity<ApiResponse<List<DoctorMessageResponse>>> getPatientThread(@PathVariable Long doctorAccountId,
                                                                                     @AuthenticationPrincipal UserPrincipal principal) {
        doctorPortalService.markThreadReadForPatient(principal.getId(), doctorAccountId);
        return ResponseEntity.ok(ApiResponse.success(
                doctorPortalService.getPatientThread(principal.getId(), doctorAccountId)));
    }

    /** Contact directory: doctors the patient can call, message or SMS. */
    @GetMapping("/api/doctor-portal/directory")
    public ResponseEntity<ApiResponse<List<DoctorAccountResponse>>> getDoctorDirectory(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.success(doctorPortalService.getDoctorDirectory(principal.getId())));
    }
}
