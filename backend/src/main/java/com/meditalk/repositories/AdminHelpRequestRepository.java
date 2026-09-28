package com.meditalk.repositories;

import com.meditalk.entities.AdminHelpRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminHelpRequestRepository extends JpaRepository<AdminHelpRequest, Long> {

    List<AdminHelpRequest> findAllByOrderByCreatedAtDesc();

    List<AdminHelpRequest> findByStatusOrderByCreatedAtDesc(String status);

    List<AdminHelpRequest> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    long countByStatus(String status);
}
