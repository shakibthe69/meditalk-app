package com.meditalk.repositories;

import com.meditalk.entities.MedicineInformationCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicineInformationCacheRepository extends JpaRepository<MedicineInformationCache, Long> {

    Optional<MedicineInformationCache> findByLookupKey(String lookupKey);
}
