package com.meditalk.repositories;

import com.meditalk.entities.AdminContactLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminContactLogRepository extends JpaRepository<AdminContactLog, Long> {

    List<AdminContactLog> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<AdminContactLog> findTop50ByOrderByCreatedAtDesc();
}
