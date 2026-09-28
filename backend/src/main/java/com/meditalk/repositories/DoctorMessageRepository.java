package com.meditalk.repositories;

import com.meditalk.entities.DoctorMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorMessageRepository extends JpaRepository<DoctorMessage, Long> {
    List<DoctorMessage> findByDoctorAccountIdAndPatientIdOrderByCreatedAtAsc(Long doctorAccountId, Long patientId);

    List<DoctorMessage> findByDoctorAccountIdOrderByCreatedAtAsc(Long doctorAccountId);

    List<DoctorMessage> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    long countByPatientIdAndFromDoctorTrueAndIsReadFalse(Long patientId);

    long countByDoctorAccountIdAndFromDoctorFalseAndIsReadFalse(Long doctorAccountId);

    long countByPatientId(Long patientId);
}
