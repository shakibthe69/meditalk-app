package com.meditalk.dto;

public class AuthResponse {
    private String token;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserDto user;

    public AuthResponse() {}

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final AuthResponse res = new AuthResponse();

        public Builder token(String token) { res.setToken(token); return this; }
        public Builder tokenType(String tokenType) { res.setTokenType(tokenType); return this; }
        public Builder expiresIn(long expiresIn) { res.setExpiresIn(expiresIn); return this; }
        public Builder user(UserDto user) { res.setUser(user); return this; }

        public AuthResponse build() { return res; }
    }
}
