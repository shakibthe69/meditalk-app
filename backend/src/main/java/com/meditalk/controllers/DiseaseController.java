package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.dto.DiseaseCategoryDto;
import com.meditalk.dto.DiseaseDetailDto;
import com.meditalk.dto.DiseaseRequestDto;
import com.meditalk.dto.DiseaseSummaryDto;
import com.meditalk.services.DiseaseService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diseases")
public class DiseaseController {

    private final DiseaseService diseaseService;

    public DiseaseController(DiseaseService diseaseService) {
        this.diseaseService = diseaseService;
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<DiseaseCategoryDto>>> getCategories() {
        List<DiseaseCategoryDto> categories = diseaseService.getCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<List<DiseaseSummaryDto>>> getPopularDiseases() {
        List<DiseaseSummaryDto> popular = diseaseService.getPopularDiseases();
        return ResponseEntity.ok(ApiResponse.success(popular));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchDiseases(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        Page<DiseaseSummaryDto> resultPage = diseaseService.searchDiseases(q, page, size);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "content", resultPage.getContent(),
                "page", resultPage.getNumber(),
                "size", resultPage.getSize(),
                "totalElements", resultPage.getTotalElements(),
                "totalPages", resultPage.getTotalPages(),
                "last", resultPage.isLast()
        )));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDiseasesByCategory(
            @PathVariable Long categoryId,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        Page<DiseaseSummaryDto> resultPage = diseaseService.getDiseasesByCategory(categoryId, page, size);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "content", resultPage.getContent(),
                "page", resultPage.getNumber(),
                "size", resultPage.getSize(),
                "totalElements", resultPage.getTotalElements(),
                "totalPages", resultPage.getTotalPages(),
                "last", resultPage.isLast()
        )));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DiseaseDetailDto>> getDiseaseById(@PathVariable Long id) {
        DiseaseDetailDto disease = diseaseService.getDiseaseById(id);
        return ResponseEntity.ok(ApiResponse.success(disease));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<DiseaseDetailDto>> getDiseaseBySlug(@PathVariable String slug) {
        DiseaseDetailDto disease = diseaseService.getDiseaseBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(disease));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllDiseases(
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        Page<DiseaseSummaryDto> resultPage = diseaseService.getAllDiseases(page, size);
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "content", resultPage.getContent(),
                "page", resultPage.getNumber(),
                "size", resultPage.getSize(),
                "totalElements", resultPage.getTotalElements(),
                "totalPages", resultPage.getTotalPages(),
                "last", resultPage.isLast()
        )));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DiseaseDetailDto>> createDisease(@Valid @RequestBody DiseaseRequestDto request) {
        DiseaseDetailDto created = diseaseService.createDisease(request);
        return ResponseEntity.ok(ApiResponse.success(created, "Disease information created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DiseaseDetailDto>> updateDisease(
            @PathVariable Long id,
            @Valid @RequestBody DiseaseRequestDto request
    ) {
        DiseaseDetailDto updated = diseaseService.updateDisease(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Disease information updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDisease(@PathVariable Long id) {
        diseaseService.deleteDisease(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Disease deleted successfully"));
    }
}
