package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.OcrParseRequest;
import com.meditalk.dto.OcrParseResponse;
import com.meditalk.services.OcrAiParserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ocr")
public class OcrController {

    private final OcrAiParserService ocrAiParserService;

    public OcrController(OcrAiParserService ocrAiParserService) {
        this.ocrAiParserService = ocrAiParserService;
    }

    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<OcrParseResponse>> parsePrescription(@Valid @RequestBody OcrParseRequest request) {
        OcrParseResponse response = ocrAiParserService.parsePrescriptionText(request);
        return ResponseEntity.ok(ApiResponse.success(response, "OCR Text parsed successfully into draft prescription"));
    }
}
