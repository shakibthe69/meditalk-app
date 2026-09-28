package com.meditalk.repositories;

import com.meditalk.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);

    /** Cheap activity heartbeat: avoids loading the whole entity per request. */
    @Modifying
    @Query("UPDATE User u SET u.lastActiveAt = :now WHERE u.id = :id")
    void touchLastActive(@Param("id") Long id, @Param("now") LocalDateTime now);

    long countByRole(String role);

    /** Users whose last activity falls inside the window (null activity falls back to createdAt). */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND ((u.lastActiveAt IS NOT NULL AND u.lastActiveAt >= :since) OR (u.lastActiveAt IS NULL AND u.createdAt >= :since))")
    long countActiveSince(@Param("role") String role, @Param("since") LocalDateTime since);

    /** Patients with no recorded activity for at least {@code since} days (or never). */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND (u.lastActiveAt IS NULL OR u.lastActiveAt < :cutoff) AND (u.lastActiveAt IS NOT NULL OR u.createdAt < :cutoff)")
    long countInactiveSince(@Param("role") String role, @Param("cutoff") LocalDateTime cutoff);

    /** Patients active inside a report window (last activity between from and to). */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.lastActiveAt IS NOT NULL AND u.lastActiveAt >= :from AND u.lastActiveAt < :to")
    long countActiveBetween(@Param("role") String role, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Accounts created inside a report window. */
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.createdAt >= :from AND u.createdAt < :to")
    long countCreatedBetween(@Param("role") String role, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT u FROM User u WHERE u.role = :role ORDER BY u.createdAt DESC")
    List<User> findAllByRole(@Param("role") String role);
}
