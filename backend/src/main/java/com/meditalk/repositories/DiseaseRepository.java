package com.meditalk.repositories;

import com.meditalk.entities.Disease;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiseaseRepository extends JpaRepository<Disease, Long> {

    Page<Disease> findByStatus(String status, Pageable pageable);

    Page<Disease> findByCategoryIdAndStatus(Long categoryId, String status, Pageable pageable);

    List<Disease> findByIsPopularTrueAndStatusOrderByViewCountDesc(String status);

    Optional<Disease> findByIdAndStatus(Long id, String status);

    Optional<Disease> findBySlugAndStatus(String slug, String status);

    @Query("SELECT d FROM Disease d WHERE d.status = :status AND (" +
            "LOWER(d.nameEn) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "d.nameBn LIKE CONCAT('%', :q, '%') OR " +
            "LOWER(d.alternativeNamesEn) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "d.alternativeNamesBn LIKE CONCAT('%', :q, '%') OR " +
            "LOWER(d.overviewEn) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "d.overviewBn LIKE CONCAT('%', :q, '%')" +
            ") ORDER BY d.isPopular DESC, d.viewCount DESC")
    Page<Disease> searchDiseases(@Param("q") String query, @Param("status") String status, Pageable pageable);

    long countByCategoryIdAndStatus(Long categoryId, String status);
}
