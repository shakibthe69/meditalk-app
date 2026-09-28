package com.meditalk.websocket;

import com.meditalk.security.CustomUserDetailsService;
import com.meditalk.security.JwtTokenProvider;
import com.meditalk.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * Authenticates the WebSocket handshake.
 *
 * <p>Browsers and React Native's WebSocket cannot set custom headers on the
 * handshake request, so the bearer token is passed as a {@code token} query
 * parameter: {@code ws://host:8080/ws/chat?token=<jwt>}.
 */
@Component
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private static final Logger log = LoggerFactory.getLogger(WebSocketAuthInterceptor.class);

    public static final String ATTR_USER_ID = "userId";
    public static final String ATTR_ROLE = "role";
    public static final String ATTR_FULL_NAME = "fullName";

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public WebSocketAuthInterceptor(JwtTokenProvider tokenProvider,
                                    CustomUserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) {
        String token = UriComponentsBuilder.fromUri(request.getURI())
                .build()
                .getQueryParams()
                .getFirst("token");

        if (!StringUtils.hasText(token) || !tokenProvider.validateToken(token)) {
            log.warn("Rejected realtime handshake from {} — missing or invalid token", request.getRemoteAddress());
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            Long userId = tokenProvider.getUserIdFromJWT(token);
            UserPrincipal principal = (UserPrincipal) userDetailsService.loadUserById(userId);

            attributes.put(ATTR_USER_ID, userId);
            attributes.put(ATTR_ROLE, principal.getAuthorities().stream().findFirst()
                    .map(a -> a.getAuthority()).orElse(null));
            attributes.put(ATTR_FULL_NAME, principal.getFullName());
            return true;
        } catch (Exception e) {
            log.warn("Rejected realtime handshake — could not resolve user", e);
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // no-op
    }
}
