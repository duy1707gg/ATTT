package com.securevault.payload.request;

import lombok.Data;

@Data
public class ResendOtpRequest {
    private String email;
    private String username;
}
