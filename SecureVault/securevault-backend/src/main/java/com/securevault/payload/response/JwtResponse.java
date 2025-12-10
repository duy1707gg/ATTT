package com.securevault.payload.response;

import lombok.Data;

import java.util.List;

@Data
public class JwtResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private Long expiresIn; // Token expiration in milliseconds
    private Long id;
    private String username;
    private String email;
    private List<String> roles;

    public JwtResponse(String accessToken, String refreshToken, Long expiresIn, Long id, String username, String email,
            List<String> roles) {
        this.token = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }

    // Backward compatible constructor
    public JwtResponse(String accessToken, Long id, String username, String email, List<String> roles) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
    }
}
