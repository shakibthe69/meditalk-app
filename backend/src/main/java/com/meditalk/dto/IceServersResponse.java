package com.meditalk.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * ICE servers for the browser/React Native {@code RTCPeerConnection}.
 * Shape matches the WebRTC {@code RTCConfiguration.iceServers} entry.
 */
public class IceServersResponse {

    private List<IceServer> iceServers = new ArrayList<>();

    /** True when a TURN relay is configured, i.e. calls can cross strict NATs. */
    private boolean relayAvailable;

    public IceServersResponse() {}

    public List<IceServer> getIceServers() { return iceServers; }
    public void setIceServers(List<IceServer> iceServers) { this.iceServers = iceServers; }

    public boolean isRelayAvailable() { return relayAvailable; }
    public void setRelayAvailable(boolean relayAvailable) { this.relayAvailable = relayAvailable; }

    public static class IceServer {
        private List<String> urls = new ArrayList<>();
        private String username;
        private String credential;

        public IceServer() {}

        public IceServer(List<String> urls) {
            this.urls = urls;
        }

        public IceServer(List<String> urls, String username, String credential) {
            this.urls = urls;
            this.username = username;
            this.credential = credential;
        }

        public List<String> getUrls() { return urls; }
        public void setUrls(List<String> urls) { this.urls = urls; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getCredential() { return credential; }
        public void setCredential(String credential) { this.credential = credential; }
    }
}
