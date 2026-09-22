package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.OcrParseRequest;
import com.meditalk.dto.OcrParseResponse;
import com.meditalk.services.FileStorageService;
import com.meditalk.services.GoogleCloudVisionOcrService;
import com.meditalk.services.ImagePreprocessingService;
import com.meditalk.services.OcrAiParserService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    private final OcrAiParserService ocrAiParserService;
    private final ImagePreprocessingService preprocessingService;
    private final GoogleCloudVisionOcrService visionOcrService;
    private final FileStorageService fileStorageService;

    public OcrController(OcrAiParserService ocrAiParserService,
                         ImagePreprocessingService preprocessingService,
                         GoogleCloudVisionOcrService visionOcrService,
                         FileStorageService fileStorageService) {
        this.ocrAiParserService = ocrAiParserService;
        this.preprocessingService = preprocessingService;
        this.visionOcrService = visionOcrService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<OcrParseResponse>> parsePrescription(@Valid @RequestBody OcrParseRequest request) {
        OcrParseResponse response = ocrAiParserService.parsePrescriptionText(request);
        return ResponseEntity.ok(ApiResponse.success(response, "OCR Text parsed successfully into draft prescription"));
    }

    @PostMapping(value = "/scan", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OcrParseResponse>> scanPrescriptionImage(@RequestParam("file") MultipartFile file) {
        String storedImageUrl = fileStorageService.storeFile(file);
        ImagePreprocessingService.PreprocessedImageResult preprocessed = preprocessingService.preprocess(file);
        GoogleCloudVisionOcrService.OcrTextResult ocrResult = visionOcrService.detectText(preprocessed.getImageBytes());

        OcrParseResponse response = ocrAiParserService.parsePrescriptionTextWithMetadata(
                ocrResult.getFullText(),
                storedImageUrl,
                ocrResult.getDetectedLanguages(),
                ocrResult.getConfidenceScore(),
                preprocessed.getSummary()
        );

        return ResponseEntity.ok(ApiResponse.success(response, "Image preprocessed, scanned, and parsed successfully"));
    }
}
