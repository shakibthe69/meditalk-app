package com.meditalk.services;

import com.meditalk.dto.*;
import com.meditalk.entities.*;
import com.meditalk.exceptions.ResourceNotFoundException;
import com.meditalk.repositories.DiseaseCategoryRepository;
import com.meditalk.repositories.DiseaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DiseaseService {

    private final DiseaseRepository diseaseRepository;
    private final DiseaseCategoryRepository categoryRepository;

    public DiseaseService(DiseaseRepository diseaseRepository, DiseaseCategoryRepository categoryRepository) {
        this.diseaseRepository = diseaseRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<DiseaseCategoryDto> getCategories() {
        List<DiseaseCategory> categories = categoryRepository.findAllByOrderByDisplayOrderAsc();
        return categories.stream().map(c -> {
            long count = diseaseRepository.countByCategoryIdAndStatus(c.getId(), "PUBLISHED");
            return DiseaseCategoryDto.builder()
                    .id(c.getId())
                    .nameEn(c.getNameEn())
                    .nameBn(c.getNameBn())
                    .slug(c.getSlug())
                    .icon(c.getIcon())
                    .descriptionEn(c.getDescriptionEn())
                    .descriptionBn(c.getDescriptionBn())
                    .displayOrder(c.getDisplayOrder())
                    .diseaseCount(count)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<DiseaseSummaryDto> getPopularDiseases() {
        return diseaseRepository.findByIsPopularTrueAndStatusOrderByViewCountDesc("PUBLISHED")
                .stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    public Page<DiseaseSummaryDto> searchDiseases(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        if (query == null || query.isBlank()) {
            return diseaseRepository.findByStatus("PUBLISHED", PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "isPopular").and(Sort.by(Sort.Direction.DESC, "viewCount"))))
                    .map(this::mapToSummaryDto);
        }
        return diseaseRepository.searchDiseases(query.trim(), "PUBLISHED", pageable)
                .map(this::mapToSummaryDto);
    }

    public Page<DiseaseSummaryDto> getDiseasesByCategory(Long categoryId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "nameEn"));
        return diseaseRepository.findByCategoryIdAndStatus(categoryId, "PUBLISHED", pageable)
                .map(this::mapToSummaryDto);
    }

    public Page<DiseaseSummaryDto> getAllDiseases(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "nameEn"));
        return diseaseRepository.findByStatus("PUBLISHED", pageable)
                .map(this::mapToSummaryDto);
    }

    @Transactional
    public DiseaseDetailDto getDiseaseById(Long id) {
        Disease disease = diseaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disease not found with id: " + id));

        // Increment view count
        disease.setViewCount(disease.getViewCount() + 1);
        diseaseRepository.save(disease);

        return mapToDetailDto(disease);
    }

    @Transactional
    public DiseaseDetailDto getDiseaseBySlug(String slug) {
        Disease disease = diseaseRepository.findBySlugAndStatus(slug, "PUBLISHED")
                .orElseThrow(() -> new ResourceNotFoundException("Disease not found with slug: " + slug));

        disease.setViewCount(disease.getViewCount() + 1);
        diseaseRepository.save(disease);

        return mapToDetailDto(disease);
    }

    @Transactional
    public DiseaseDetailDto createDisease(DiseaseRequestDto request) {
        DiseaseCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));

        String slug = (request.getSlug() != null && !request.getSlug().isBlank())
                ? request.getSlug()
                : generateSlug(request.getNameEn());

        Disease disease = Disease.builder()
                .nameEn(request.getNameEn())
                .nameBn(request.getNameBn())
                .slug(slug)
                .category(category)
                .subcategoryEn(request.getSubcategoryEn())
                .subcategoryBn(request.getSubcategoryBn())
                .alternativeNamesEn(request.getAlternativeNamesEn())
                .alternativeNamesBn(request.getAlternativeNamesBn())
                .overviewEn(request.getOverviewEn())
                .overviewBn(request.getOverviewBn())
                .diagnosisEn(request.getDiagnosisEn())
                .diagnosisBn(request.getDiagnosisBn())
                .treatmentOverviewEn(request.getTreatmentOverviewEn())
                .treatmentOverviewBn(request.getTreatmentOverviewBn())
                .homeCareEn(request.getHomeCareEn())
                .homeCareBn(request.getHomeCareBn())
                .dietLifestyleEn(request.getDietLifestyleEn())
                .dietLifestyleBn(request.getDietLifestyleBn())
                .preventionEn(request.getPreventionEn())
                .preventionBn(request.getPreventionBn())
                .doctorVisitEn(request.getDoctorVisitEn())
                .doctorVisitBn(request.getDoctorVisitBn())
                .emergencyEn(request.getEmergencyEn())
                .emergencyBn(request.getEmergencyBn())
                .durationEn(request.getDurationEn())
                .durationBn(request.getDurationBn())
                .isPopular(request.getIsPopular() != null ? request.getIsPopular() : false)
                .status(request.getStatus() != null ? request.getStatus() : "PUBLISHED")
                .sourceName(request.getSourceName())
                .sourceUrl(request.getSourceUrl())
                .referenceNote(request.getReferenceNote())
                .lastReviewedAt(request.getLastReviewedAt() != null ? request.getLastReviewedAt() : LocalDate.now())
                .build();

        // Symptoms
        if (request.getSymptoms() != null) {
            int order = 0;
            for (DiseaseRequestDto.SymptomItem s : request.getSymptoms()) {
                disease.getSymptoms().add(DiseaseSymptom.builder()
                        .disease(disease)
                        .symptomEn(s.getSymptomEn())
                        .symptomBn(s.getSymptomBn())
                        .isPrimary(s.getIsPrimary() != null ? s.getIsPrimary() : false)
                        .displayOrder(order++)
                        .build());
            }
        }

        // Causes
        if (request.getCauses() != null) {
            int order = 0;
            for (DiseaseRequestDto.CauseItem c : request.getCauses()) {
                disease.getCauses().add(DiseaseCause.builder()
                        .disease(disease)
                        .causeEn(c.getCauseEn())
                        .causeBn(c.getCauseBn())
                        .displayOrder(order++)
                        .build());
            }
        }

        // Risk Factors
        if (request.getRiskFactors() != null) {
            int order = 0;
            for (DiseaseRequestDto.RiskFactorItem r : request.getRiskFactors()) {
                disease.getRiskFactors().add(DiseaseRiskFactor.builder()
                        .disease(disease)
                        .factorEn(r.getFactorEn())
                        .factorBn(r.getFactorBn())
                        .displayOrder(order++)
                        .build());
            }
        }

        // Medicines
        if (request.getMedicines() != null) {
            int order = 0;
            for (DiseaseRequestDto.MedicineInfoItem m : request.getMedicines()) {
                disease.getMedicines().add(DiseaseMedicineInfo.builder()
                        .disease(disease)
                        .nameEn(m.getNameEn())
                        .nameBn(m.getNameBn())
                        .drugClassEn(m.getDrugClassEn())
                        .drugClassBn(m.getDrugClassBn())
                        .generalInfoEn(m.getGeneralInfoEn())
                        .generalInfoBn(m.getGeneralInfoBn())
                        .disclaimerEn(m.getDisclaimerEn())
                        .disclaimerBn(m.getDisclaimerBn())
                        .displayOrder(order++)
                        .build());
            }
        }

        // Warning Signs
        if (request.getWarningSigns() != null) {
            int order = 0;
            for (DiseaseRequestDto.WarningSignItem w : request.getWarningSigns()) {
                disease.getWarningSigns().add(DiseaseWarningSign.builder()
                        .disease(disease)
                        .signEn(w.getSignEn())
                        .signBn(w.getSignBn())
                        .isEmergency(w.getIsEmergency() != null ? w.getIsEmergency() : false)
                        .displayOrder(order++)
                        .build());
            }
        }

        // Related Diseases
        if (request.getRelatedDiseaseIds() != null && !request.getRelatedDiseaseIds().isEmpty()) {
            List<Disease> related = diseaseRepository.findAllById(request.getRelatedDiseaseIds());
            disease.setRelatedDiseases(related);
        }

        Disease saved = diseaseRepository.save(disease);
        return mapToDetailDto(saved);
    }

    @Transactional
    public DiseaseDetailDto updateDisease(Long id, DiseaseRequestDto request) {
        Disease disease = diseaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disease not found with id: " + id));

        if (request.getCategoryId() != null) {
            DiseaseCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
            disease.setCategory(category);
        }

        disease.setNameEn(request.getNameEn());
        disease.setNameBn(request.getNameBn());
        if (request.getSlug() != null) disease.setSlug(request.getSlug());
        if (request.getSubcategoryEn() != null) disease.setSubcategoryEn(request.getSubcategoryEn());
        if (request.getSubcategoryBn() != null) disease.setSubcategoryBn(request.getSubcategoryBn());
        if (request.getAlternativeNamesEn() != null) disease.setAlternativeNamesEn(request.getAlternativeNamesEn());
        if (request.getAlternativeNamesBn() != null) disease.setAlternativeNamesBn(request.getAlternativeNamesBn());
        if (request.getOverviewEn() != null) disease.setOverviewEn(request.getOverviewEn());
        if (request.getOverviewBn() != null) disease.setOverviewBn(request.getOverviewBn());
        if (request.getDiagnosisEn() != null) disease.setDiagnosisEn(request.getDiagnosisEn());
        if (request.getDiagnosisBn() != null) disease.setDiagnosisBn(request.getDiagnosisBn());
        if (request.getTreatmentOverviewEn() != null) disease.setTreatmentOverviewEn(request.getTreatmentOverviewEn());
        if (request.getTreatmentOverviewBn() != null) disease.setTreatmentOverviewBn(request.getTreatmentOverviewBn());
        if (request.getHomeCareEn() != null) disease.setHomeCareEn(request.getHomeCareEn());
        if (request.getHomeCareBn() != null) disease.setHomeCareBn(request.getHomeCareBn());
        if (request.getDietLifestyleEn() != null) disease.setDietLifestyleEn(request.getDietLifestyleEn());
        if (request.getDietLifestyleBn() != null) disease.setDietLifestyleBn(request.getDietLifestyleBn());
        if (request.getPreventionEn() != null) disease.setPreventionEn(request.getPreventionEn());
        if (request.getPreventionBn() != null) disease.setPreventionBn(request.getPreventionBn());
        if (request.getDoctorVisitEn() != null) disease.setDoctorVisitEn(request.getDoctorVisitEn());
        if (request.getDoctorVisitBn() != null) disease.setDoctorVisitBn(request.getDoctorVisitBn());
        if (request.getEmergencyEn() != null) disease.setEmergencyEn(request.getEmergencyEn());
        if (request.getEmergencyBn() != null) disease.setEmergencyBn(request.getEmergencyBn());
        if (request.getDurationEn() != null) disease.setDurationEn(request.getDurationEn());
        if (request.getDurationBn() != null) disease.setDurationBn(request.getDurationBn());
        if (request.getIsPopular() != null) disease.setIsPopular(request.getIsPopular());
        if (request.getStatus() != null) disease.setStatus(request.getStatus());
        if (request.getSourceName() != null) disease.setSourceName(request.getSourceName());
        if (request.getSourceUrl() != null) disease.setSourceUrl(request.getSourceUrl());
        if (request.getReferenceNote() != null) disease.setReferenceNote(request.getReferenceNote());
        if (request.getLastReviewedAt() != null) disease.setLastReviewedAt(request.getLastReviewedAt());

        Disease saved = diseaseRepository.save(disease);
        return mapToDetailDto(saved);
    }

    @Transactional
    public void deleteDisease(Long id) {
        Disease disease = diseaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disease not found with id: " + id));
        diseaseRepository.delete(disease);
    }

    public DiseaseSummaryDto mapToSummaryDto(Disease d) {
        String shortEn = d.getOverviewEn() != null
                ? (d.getOverviewEn().length() > 140 ? d.getOverviewEn().substring(0, 137) + "..." : d.getOverviewEn())
                : "";
        String shortBn = d.getOverviewBn() != null
                ? (d.getOverviewBn().length() > 140 ? d.getOverviewBn().substring(0, 137) + "..." : d.getOverviewBn())
                : "";

        return DiseaseSummaryDto.builder()
                .id(d.getId())
                .nameEn(d.getNameEn())
                .nameBn(d.getNameBn())
                .slug(d.getSlug())
                .categoryId(d.getCategory() != null ? d.getCategory().getId() : null)
                .categoryNameEn(d.getCategory() != null ? d.getCategory().getNameEn() : "")
                .categoryNameBn(d.getCategory() != null ? d.getCategory().getNameBn() : "")
                .categoryIcon(d.getCategory() != null ? d.getCategory().getIcon() : "activity")
                .subcategoryEn(d.getSubcategoryEn())
                .subcategoryBn(d.getSubcategoryBn())
                .shortOverviewEn(shortEn)
                .shortOverviewBn(shortBn)
                .isPopular(d.getIsPopular())
                .viewCount(d.getViewCount())
                .status(d.getStatus())
                .build();
    }

    public DiseaseDetailDto mapToDetailDto(Disease d) {
        DiseaseDetailDto dto = new DiseaseDetailDto();
        dto.setId(d.getId());
        dto.setNameEn(d.getNameEn());
        dto.setNameBn(d.getNameBn());
        dto.setSlug(d.getSlug());

        if (d.getCategory() != null) {
            dto.setCategoryId(d.getCategory().getId());
            dto.setCategoryNameEn(d.getCategory().getNameEn());
            dto.setCategoryNameBn(d.getCategory().getNameBn());
            dto.setCategoryIcon(d.getCategory().getIcon());
        }

        dto.setSubcategoryEn(d.getSubcategoryEn());
        dto.setSubcategoryBn(d.getSubcategoryBn());
        dto.setAlternativeNamesEn(d.getAlternativeNamesEn());
        dto.setAlternativeNamesBn(d.getAlternativeNamesBn());
        dto.setOverviewEn(d.getOverviewEn());
        dto.setOverviewBn(d.getOverviewBn());
        dto.setDiagnosisEn(d.getDiagnosisEn());
        dto.setDiagnosisBn(d.getDiagnosisBn());
        dto.setTreatmentOverviewEn(d.getTreatmentOverviewEn());
        dto.setTreatmentOverviewBn(d.getTreatmentOverviewBn());
        dto.setHomeCareEn(d.getHomeCareEn());
        dto.setHomeCareBn(d.getHomeCareBn());
        dto.setDietLifestyleEn(d.getDietLifestyleEn());
        dto.setDietLifestyleBn(d.getDietLifestyleBn());
        dto.setPreventionEn(d.getPreventionEn());
        dto.setPreventionBn(d.getPreventionBn());
        dto.setDoctorVisitEn(d.getDoctorVisitEn());
        dto.setDoctorVisitBn(d.getDoctorVisitBn());
        dto.setEmergencyEn(d.getEmergencyEn());
        dto.setEmergencyBn(d.getEmergencyBn());
        dto.setDurationEn(d.getDurationEn());
        dto.setDurationBn(d.getDurationBn());
        dto.setIsPopular(d.getIsPopular());
        dto.setViewCount(d.getViewCount());
        dto.setStatus(d.getStatus());
        dto.setSourceName(d.getSourceName());
        dto.setSourceUrl(d.getSourceUrl());
        dto.setReferenceNote(d.getReferenceNote());
        dto.setLastReviewedAt(d.getLastReviewedAt());

        // Symptoms
        if (d.getSymptoms() != null) {
            dto.setSymptoms(d.getSymptoms().stream()
                    .map(s -> new DiseaseDetailDto.SymptomDto(s.getId(), s.getSymptomEn(), s.getSymptomBn(), s.getIsPrimary()))
                    .collect(Collectors.toList()));
        }

        // Causes
        if (d.getCauses() != null) {
            dto.setCauses(d.getCauses().stream()
                    .map(c -> new DiseaseDetailDto.CauseDto(c.getId(), c.getCauseEn(), c.getCauseBn()))
                    .collect(Collectors.toList()));
        }

        // Risk Factors
        if (d.getRiskFactors() != null) {
            dto.setRiskFactors(d.getRiskFactors().stream()
                    .map(r -> new DiseaseDetailDto.RiskFactorDto(r.getId(), r.getFactorEn(), r.getFactorBn()))
                    .collect(Collectors.toList()));
        }

        // Medicines
        if (d.getMedicines() != null) {
            dto.setMedicines(d.getMedicines().stream()
                    .map(m -> new DiseaseDetailDto.MedicineInfoDto(m.getId(), m.getNameEn(), m.getNameBn(),
                            m.getDrugClassEn(), m.getDrugClassBn(), m.getGeneralInfoEn(), m.getGeneralInfoBn(),
                            m.getDisclaimerEn(), m.getDisclaimerBn()))
                    .collect(Collectors.toList()));
        }

        // Warning Signs
        if (d.getWarningSigns() != null) {
            dto.setWarningSigns(d.getWarningSigns().stream()
                    .map(w -> new DiseaseDetailDto.WarningSignDto(w.getId(), w.getSignEn(), w.getSignBn(), w.getIsEmergency()))
                    .collect(Collectors.toList()));
        }

        // Related Diseases
        if (d.getRelatedDiseases() != null) {
            dto.setRelatedDiseases(d.getRelatedDiseases().stream()
                    .map(rel -> new DiseaseDetailDto.RelatedDiseaseDto(rel.getId(), rel.getNameEn(), rel.getNameBn(), rel.getSlug()))
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private String generateSlug(String name) {
        if (name == null) return "disease-" + System.currentTimeMillis();
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-") + "-" + (System.currentTimeMillis() % 10000);
    }
}
