package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.PrescriptionRequest;
import com.meditalk.dto.PrescriptionResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.dto.OcrParseResponse;
import com.meditalk.services.*;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final ImagePreprocessingService preprocessingService;
    private final GoogleCloudVisionOcrService visionOcrService;
    private final OcrAiParserService parserService;
    private final FileStorageService fileStorageService;

    public PrescriptionController(PrescriptionService prescriptionService,
                                  ImagePreprocessingService preprocessingService,
                                  GoogleCloudVisionOcrService visionOcrService,
                                  OcrAiParserService parserService,
                                  FileStorageService fileStorageService) {
        this.prescriptionService = prescriptionService;
        this.preprocessingService = preprocessingService;
        this.visionOcrService = visionOcrService;
        this.parserService = parserService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OcrParseResponse>> scanPrescription(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {

        // 1. Store the uploaded original file for reference
        String storedImageUrl = fileStorageService.storeFile(file);

        // 2. Preprocess the image (orientation, clamped resize, grayscale, contrast, sharpening)
        ImagePreprocessingService.PreprocessedImageResult preprocessed = preprocessingService.preprocess(file);

        // 3. Call Google Cloud Vision OCR (DOCUMENT_TEXT_DETECTION with en & bn)
        GoogleCloudVisionOcrService.OcrTextResult ocrResult = visionOcrService.detectText(preprocessed.getImageBytes());

        // 4. Parse raw OCR text into structured prescription draft
        OcrParseResponse response = parserService.parsePrescriptionTextWithMetadata(
                ocrResult.getFullText(),
                storedImageUrl,
                ocrResult.getDetectedLanguages(),
                ocrResult.getConfidenceScore(),
                preprocessed.getSummary()
        );

        return ResponseEntity.ok(ApiResponse.success(response, "Prescription scanned and parsed successfully"));
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

    @PostMapping
    public ResponseEntity<ApiResponse<PrescriptionResponse>> createPrescription(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PrescriptionRequest request) {
        PrescriptionResponse saved = prescriptionService.createPrescription(principal.getId(), request);
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
