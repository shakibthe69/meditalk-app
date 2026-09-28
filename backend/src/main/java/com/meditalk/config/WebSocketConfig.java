package com.meditalk.config;

import com.meditalk.websocket.ChatWebSocketHandler;
import com.meditalk.websocket.WebSocketAuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Exposes the single realtime endpoint used by the mobile app:
 * {@code ws://<host>:8080/ws/chat?token=<jwt>}.
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    public static final String CHAT_ENDPOINT = "/ws/chat";

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    public WebSocketConfig(ChatWebSocketHandler chatWebSocketHandler,
                           WebSocketAuthInterceptor webSocketAuthInterceptor) {
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.webSocketAuthInterceptor = webSocketAuthInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, CHAT_ENDPOINT)
                .addInterceptors(webSocketAuthInterceptor)
                // Native clients send no browser Origin, and the handshake is
                // authenticated by JWT instead of cookies.
                .setAllowedOrigins("*");
    }
}
