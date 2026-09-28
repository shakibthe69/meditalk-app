package com.meditalk.repositories;

import com.meditalk.entities.AdminNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminNoteRepository extends JpaRepository<AdminNote, Long> {

    List<AdminNote> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
