package com.meditalk.repositories;

import com.meditalk.entities.DoctorPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorPostRepository extends JpaRepository<DoctorPost, Long> {
    List<DoctorPost> findByDoctorAccountIdOrderByCreatedAtDesc(Long doctorAccountId);

    List<DoctorPost> findAllByOrderByCreatedAtDesc();
}
