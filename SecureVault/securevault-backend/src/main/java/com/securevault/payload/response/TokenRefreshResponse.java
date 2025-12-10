package com.securevault.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TokenRefreshResponse {
    private String token;
    private String refreshToken;
    private String type = "Bearer";
    private Long expiresIn;

    public TokenRefreshResponse(String token, String refreshToken, Long expiresIn) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
    }
}
