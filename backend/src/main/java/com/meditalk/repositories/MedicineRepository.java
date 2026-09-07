package com.meditalk.repositories;

import com.meditalk.entities.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Medicine> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);
    Optional<Medicine> findByIdAndUserId(Long id, Long userId);
}
