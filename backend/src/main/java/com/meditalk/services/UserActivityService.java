package com.meditalk.services;

import com.meditalk.repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Records when a patient last used the app.
 *
 * <p>{@code lastActiveAt} is only ever used as a <em>follow-up signal</em> for
 * administrators — never as a medical fact. Writes are throttled in memory so a
 * chatty client cannot turn every authenticated request into a database update.
 */
@Service
public class UserActivityService {

    /** Minimum gap between two persisted heartbeats for the same user. */
    private static final long THROTTLE_MS = 5 * 60 * 1000L;

    private final UserRepository userRepository;
    private final Map<Long, Long> lastTouched = new ConcurrentHashMap<>();

    public UserActivityService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Marks the user as active now (no-op when the last heartbeat is recent). */
    @Transactional
    public void touch(Long userId) {
        if (userId == null) return;

        long now = System.currentTimeMillis();
        Long previous = lastTouched.get(userId);
        if (previous != null && now - previous < THROTTLE_MS) {
            return;
        }
        lastTouched.put(userId, now);
        userRepository.touchLastActive(userId, LocalDateTime.now());
    }

    /** Forces an update regardless of the throttle (used by the heartbeat endpoint). */
    @Transactional
    public void touchNow(Long userId) {
        if (userId == null) return;
        lastTouched.put(userId, System.currentTimeMillis());
        userRepository.touchLastActive(userId, LocalDateTime.now());
    }
}
