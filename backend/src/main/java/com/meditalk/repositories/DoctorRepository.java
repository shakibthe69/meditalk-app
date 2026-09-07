package com.meditalk.repositories;

import com.meditalk.entities.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Doctor> findByIdAndUserId(Long id, Long userId);
}
