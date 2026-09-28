package com.meditalk.repositories;

import com.meditalk.entities.AdminFollowUp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminFollowUpRepository extends JpaRepository<AdminFollowUp, Long> {

    Optional<AdminFollowUp> findByUserId(Long userId);

    List<AdminFollowUp> findAllByOrderByUpdatedAtDesc();

    List<AdminFollowUp> findByStatusOrderByUpdatedAtDesc(String status);

    long countByPriorityIn(List<String> priorities);

    long countByStatus(String status);
}
