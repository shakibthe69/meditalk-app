package com.meditalk.repositories;

import com.meditalk.entities.AdminMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminMessageRepository extends JpaRepository<AdminMessage, Long> {

    List<AdminMessage> findByPatientIdOrderByCreatedAtAsc(Long patientId);

    Optional<AdminMessage> findFirstByPatientIdOrderByCreatedAtDesc(Long patientId);

    long countByPatientIdAndFromAdminFalseAndIsReadFalse(Long patientId);

    @Query("SELECT DISTINCT m.patient.id FROM AdminMessage m")
    List<Long> findDistinctPatientIds();
}
