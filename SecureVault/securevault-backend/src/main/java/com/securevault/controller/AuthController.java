package com.securevault.controller;

import com.securevault.payload.request.*;
import com.securevault.payload.response.JwtResponse;
import com.securevault.payload.response.MessageResponse;
import com.securevault.payload.response.TokenRefreshResponse;
import com.securevault.service.AuthService;
import com.securevault.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các request xác thực.
 * Chỉ xử lý HTTP request/response, business logic nằm trong AuthService.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthService authService,
            RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }

    /**
     * Đăng nhập - Bước 1: Xác thực và gửi OTP.
     */
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest request) {
        try {
            authService.initiateLogin(request.getUsername(), request.getPassword());
            return ResponseEntity.ok(new MessageResponse("Mã OTP đã được gửi đến email của bạn."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Lỗi: " + e.getMessage()));
        }
    }

    /**
     * Đăng nhập - Bước 2: Xác thực OTP.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            JwtResponse response = authService.verifyOtpAndGenerateToken(
                    request.getUsername(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Gửi lại OTP.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody ResendOtpRequest request) {
        try {
            String identifier = request.getUsername() != null ? request.getUsername() : request.getEmail();
            authService.resendOtp(identifier);
            return ResponseEntity.ok(new MessageResponse("Mã OTP mới đã được gửi đến email của bạn."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Quên mật khẩu - Gửi OTP reset password.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.requestPasswordReset(request.getEmail());
            return ResponseEntity.ok(new MessageResponse("Mã OTP đã được gửi đến email của bạn."));
        } catch (Exception e) {
            // Không tiết lộ email có tồn tại hay không để bảo mật
            return ResponseEntity.ok(new MessageResponse("Nếu email tồn tại, mã OTP sẽ được gửi."));
        }
    }

    /**
     * Đặt lại mật khẩu với OTP.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Mật khẩu đã được thay đổi thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Làm mới token.
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            TokenRefreshResponse response = refreshTokenService.refreshAccessToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Đăng xuất.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication
                .getPrincipal() instanceof com.securevault.security.services.UserDetailsImpl userDetails) {
            refreshTokenService.deleteByUserId(userDetails.getId());
        }
        return ResponseEntity.ok(new MessageResponse("Đăng xuất thành công!"));
    }

    /**
     * Đăng ký tài khoản mới.
     */
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest request) {
        try {
            authService.registerUser(request);
            return ResponseEntity.ok(new MessageResponse("Đăng ký tài khoản thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}
