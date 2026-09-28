package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.OcrParseResponse;
import com.meditalk.dto.PrescriptionOcrResponse;
import com.meditalk.dto.PrescriptionRequest;
import com.meditalk.dto.PrescriptionResponse;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.PrescriptionScanningService;
import com.meditalk.services.PrescriptionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private static final Logger log = LoggerFactory.getLogger(PrescriptionController.class);

    private final PrescriptionService prescriptionService;
    private final PrescriptionScanningService scanningService;

    public PrescriptionController(PrescriptionService prescriptionService,
                                  PrescriptionScanningService scanningService) {
        this.prescriptionService = prescriptionService;
        this.scanningService = scanningService;
    }

    /**
     * Primary prescription OCR endpoint.
     *
     * <p>Receives a prescription image (multipart field 'image' or 'file'), reads it with
     * OCR.space (Google Cloud Vision as backup), structures the text with the prescription
     * Gemini model, validates the result and returns an editable draft. Nothing is stored
     * as medical data — the patient must confirm it through POST /api/prescriptions.</p>
     */
    @PostMapping(value = "/ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PrescriptionOcrResponse>> processPrescriptionOcr(
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {

        MultipartFile targetFile = (image != null && !image.isEmpty()) ? image : file;
        if (targetFile == null || targetFile.isEmpty()) {
            throw new BadRequestException("Prescription image file is required (multipart field 'image' or 'file').");
        }

        long startedAt = System.currentTimeMillis();
        PrescriptionScanningService.ScanResult scanResult = scanningService.scan(targetFile);
        OcrParseResponse draft = scanResult.getDraft();

        log.info("Prescription scan completed for user {} in {} ms (ocr={}, extraction={}).",
                principal != null ? principal.getId() : null,
                System.currentTimeMillis() - startedAt,
                scanResult.getOcrEngine(),
                draft.getExtractionSource());

        PrescriptionOcrResponse response = PrescriptionOcrResponse.builder()
                .success(true)
                .text(draft.getRawOcrText())
                .rawOcrText(draft.getRawOcrText())
                .imageUrl(draft.getImageUrl())
                .detectedLanguages(draft.getDetectedLanguages())
                .confidenceScore(draft.getConfidenceScore())
                .preprocessingSummary(draft.getPreprocessingSummary())
                .extractionSource(draft.getExtractionSource())
                .ocrEngine(scanResult.getOcrEngine())
                .aiNotes(draft.getNotes())
                .requiresUserVerification(true)
                .safetyDisclaimer(draft.getSafetyDisclaimer() != null
                        ? draft.getSafetyDisclaimer()
                        : scanningService.getSafetyDisclaimer())
                .doctorName(draft.getDoctorName())
                .hospitalOrClinic(draft.getHospitalOrClinic())
                .prescriptionDate(draft.getPrescriptionDate())
                .diagnosis(draft.getDiagnosis())
                .medicines(draft.getMedicines())
                .build();

        return ResponseEntity.ok(ApiResponse.success(response, "Prescription read successfully. Please review before saving."));
    }

    /** Backward-compatible alias for clients still calling /api/prescriptions/scan. */
    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PrescriptionOcrResponse>> scanPrescription(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserPrincipal principal) {
        return processPrescriptionOcr(image, file, principal);
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

    /**
     * Saves a patient-confirmed prescription together with its medicines and reminder
     * schedules in a single transaction.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PrescriptionResponse>> createPrescription(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PrescriptionRequest request) {
        PrescriptionResponse saved = prescriptionService.createPrescription(principal.getId(), request);
        log.info("Prescription {} confirmed and saved for user {} with {} medicine(s).",
                saved.getId(), principal.getId(), saved.getMedicines().size());
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
