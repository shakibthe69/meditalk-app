package com.meditalk.repositories;

import com.meditalk.entities.DiseaseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiseaseCategoryRepository extends JpaRepository<DiseaseCategory, Long> {
    List<DiseaseCategory> findAllByOrderByDisplayOrderAsc();
    Optional<DiseaseCategory> findBySlug(String slug);
}
