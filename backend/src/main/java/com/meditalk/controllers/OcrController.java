package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.OcrParseRequest;
import com.meditalk.dto.OcrParseResponse;
import com.meditalk.exceptions.BadRequestException;
import com.meditalk.services.PrescriptionScanningService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    private final PrescriptionScanningService scanningService;

    public OcrController(PrescriptionScanningService scanningService) {
        this.scanningService = scanningService;
    }

    /**
     * Structures prescription text the user typed or corrected by hand.
     * Uses the same validation and fallback rules as the image pipeline.
     */
    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<OcrParseResponse>> parsePrescription(@Valid @RequestBody OcrParseRequest request) {
        PrescriptionScanningService.ScanResult result =
                scanningService.analyzeText(request.getRawText(), request.getImageUri());
        return ResponseEntity.ok(ApiResponse.success(
                result.getDraft(), "Prescription text parsed into an editable draft"));
    }

    /**
     * Scan a prescription image. Delegates to the shared OCR.space + Gemini pipeline.
     */
    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OcrParseResponse>> scanPrescriptionImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Prescription image file is required.");
        }
        PrescriptionScanningService.ScanResult result = scanningService.scan(file);
        return ResponseEntity.ok(ApiResponse.success(
                result.getDraft(), "Image scanned and parsed successfully. Please review before saving."));
    }
}
