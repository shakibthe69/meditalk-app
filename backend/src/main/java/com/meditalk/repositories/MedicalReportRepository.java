package com.meditalk.repositories;

import com.meditalk.entities.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    List<MedicalReport> findByUserIdOrderByTestDateDesc(Long userId);
    List<MedicalReport> findByUserIdAndTypeOrderByTestDateDesc(Long userId, String type);
    Optional<MedicalReport> findByIdAndUserId(Long id, Long userId);
}
