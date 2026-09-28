package com.meditalk.controllers;

import com.meditalk.dto.ApiResponse;
import com.meditalk.security.UserPrincipal;
import com.meditalk.services.UserActivityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Explicit app heartbeat. The interceptor already records activity on normal
 * usage; the mobile client also calls this on launch and on a timer so a user
 * who keeps the app open still counts as active.
 */
@RestController
@RequestMapping("/api/activity")
public class ActivityController {

    private final UserActivityService activityService;

    public ActivityController(UserActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> heartbeat(@AuthenticationPrincipal UserPrincipal principal) {
        activityService.touchNow(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("lastActiveAt", LocalDateTime.now()),
                "Activity recorded"));
    }
}
