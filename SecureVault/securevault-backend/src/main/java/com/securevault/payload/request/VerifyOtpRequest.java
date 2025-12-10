package com.securevault.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String otp;
}
