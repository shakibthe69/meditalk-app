package com.meditalk.repositories;

import com.meditalk.entities.MedicineLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicineLogRepository extends JpaRepository<MedicineLog, Long> {
    List<MedicineLog> findByUserIdOrderByLogDateDesc(Long userId);

    @Query("SELECT l FROM MedicineLog l WHERE l.user.id = :userId AND l.logDate >= :startOfDay AND l.logDate <= :endOfDay ORDER BY l.scheduledTime ASC")
    List<MedicineLog> findTodayLogsByUserId(@Param("userId") Long userId,
                                            @Param("startOfDay") LocalDateTime startOfDay,
                                            @Param("endOfDay") LocalDateTime endOfDay);

    Optional<MedicineLog> findByIdAndUserId(Long id, Long userId);
}
