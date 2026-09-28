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

    /** Aggregated status counts for one patient — used by the admin monitoring. */
    @Query("SELECT l.status, COUNT(l) FROM MedicineLog l WHERE l.user.id = :userId GROUP BY l.status")
    List<Object[]> countStatusesForUser(@Param("userId") Long userId);

    /** Status counts over a date range — used by admin reports. */
    @Query("SELECT l.status, COUNT(l) FROM MedicineLog l WHERE l.logDate >= :from AND l.logDate < :to GROUP BY l.status")
    List<Object[]> countStatusesBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** PENDING doses from previous days: always unconfirmed. */
    @Query("SELECT COUNT(l) FROM MedicineLog l WHERE l.user.id = :userId AND UPPER(l.status) = 'PENDING' AND l.logDate < :startOfDay")
    long countPendingBefore(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay);

    /** Today's scheduled times that are still pending (compared to now in Java). */
    @Query("SELECT l.scheduledTime FROM MedicineLog l WHERE l.user.id = :userId AND UPPER(l.status) = 'PENDING' AND l.logDate >= :startOfDay")
    List<String> findPendingTimesToday(@Param("userId") Long userId, @Param("startOfDay") LocalDateTime startOfDay);

    /** Distinct patients with at least one log in the window — admin reports. */
    @Query("SELECT COUNT(DISTINCT l.user.id) FROM MedicineLog l WHERE l.logDate >= :from AND l.logDate < :to")
    long countDistinctUsersBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Most recent medication interaction — shown as "last medication activity". */
    Optional<MedicineLog> findFirstByUserIdOrderByLogDateDesc(Long userId);

    List<MedicineLog> findTop20ByUserIdOrderByLogDateDesc(Long userId);
}
