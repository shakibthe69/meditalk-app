package com.meditalk.repositories;

import com.meditalk.entities.DoctorAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorAccountRepository extends JpaRepository<DoctorAccount, Long> {
    Optional<DoctorAccount> findByUserId(Long userId);
    boolean existsByLicenseNumber(String licenseNumber);
}
