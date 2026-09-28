package com.meditalk.config;

import com.meditalk.security.UserPrincipal;
import com.meditalk.services.UserActivityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Marks the signed-in user as active on normal app usage.
 *
 * <p>Runs after the JWT filter, so the security context is already populated.
 * Admin API calls are excluded: an administrator browsing patient data is not
 * patient activity.
 */
@Component
public class ActivityTrackingInterceptor implements HandlerInterceptor {

    private final UserActivityService activityService;

    public ActivityTrackingInterceptor(UserActivityService activityService) {
        this.activityService = activityService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            String path = request.getRequestURI();
            if (path != null && path.startsWith("/api/admin")) {
                return true;
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
                activityService.touch(principal.getId());
            }
        } catch (Exception ignored) {
            // Activity tracking must never break a request.
        }
        return true;
    }
}
