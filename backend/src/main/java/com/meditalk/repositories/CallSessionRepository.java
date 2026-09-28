package com.meditalk.repositories;

import com.meditalk.entities.CallSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallSessionRepository extends JpaRepository<CallSession, Long> {

    /** Every call the user took part in, newest first — patient or doctor side. */
    @Query("""
            SELECT c FROM CallSession c
            WHERE c.patient.id = :userId OR c.doctorAccount.user.id = :userId
            ORDER BY c.createdAt DESC
            """)
    List<CallSession> findAllForUser(@Param("userId") Long userId);

    /** Calls still ringing for a callee, used to expire unanswered invites. */
    List<CallSession> findByStatus(String status);
}
