package com.meditalk.controllers;

import com.meditalk.dto.MedicalHistoryPdfRequest;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.PdfGeneratorService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medical-history")
public class PdfExportController {

    private final PdfGeneratorService pdfGeneratorService;

    public PdfExportController(PdfGeneratorService pdfGeneratorService) {
        this.pdfGeneratorService = pdfGeneratorService;
    }

    @PostMapping("/pdf")
    public ResponseEntity<byte[]> generateMedicalHistoryPdf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) MedicalHistoryPdfRequest request) {

        if (request == null) {
            request = new MedicalHistoryPdfRequest();
        }

        byte[] pdfBytes = pdfGeneratorService.generateMedicalHistoryPdf(principal.getId(), request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "meditalk_medical_history.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
