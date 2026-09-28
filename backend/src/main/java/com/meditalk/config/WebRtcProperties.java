package com.meditalk.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * ICE configuration handed to clients so they can negotiate media.
 *
 * <p>STUN alone is enough when both parties share a network (host candidates
 * usually win). A TURN relay must be configured for calls that traverse
 * symmetric NATs or restrictive firewalls — set the {@code app.webrtc.turn-*}
 * properties to enable it. Credentials stay on the server and are never
 * bundled into the app.
 */
@Component
@ConfigurationProperties(prefix = "app.webrtc")
public class WebRtcProperties {

    /** Public STUN servers used for candidate discovery. */
    private List<String> stunUrls = new ArrayList<>(List.of(
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302"
    ));

    /** Optional TURN relay URL, e.g. {@code turn:turn.example.com:3478}. */
    private String turnUrl;

    private String turnUsername;

    private String turnCredential;

    public boolean isTurnConfigured() {
        return turnUrl != null && !turnUrl.isBlank();
    }

    public List<String> getStunUrls() { return stunUrls; }
    public void setStunUrls(List<String> stunUrls) { this.stunUrls = stunUrls; }

    public String getTurnUrl() { return turnUrl; }
    public void setTurnUrl(String turnUrl) { this.turnUrl = turnUrl; }

    public String getTurnUsername() { return turnUsername; }
    public void setTurnUsername(String turnUsername) { this.turnUsername = turnUsername; }

    public String getTurnCredential() { return turnCredential; }
    public void setTurnCredential(String turnCredential) { this.turnCredential = turnCredential; }
}
