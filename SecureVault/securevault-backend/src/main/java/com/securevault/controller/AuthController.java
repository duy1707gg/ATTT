package com.securevault.controller;

import com.securevault.entity.RefreshToken;
import com.securevault.entity.User;
import com.securevault.enums.Role;
import com.securevault.payload.request.LoginRequest;
import com.securevault.payload.request.RefreshTokenRequest;
import com.securevault.payload.request.*;
import com.securevault.payload.response.JwtResponse;
import com.securevault.payload.response.MessageResponse;
import com.securevault.payload.response.TokenRefreshResponse;
import com.securevault.repository.UserRepository;
import com.securevault.security.jwt.JwtUtils;
import com.securevault.security.services.UserDetailsImpl;
import com.securevault.service.EmailService;
import com.securevault.service.RefreshTokenService;
import com.securevault.blockchain.Blockchain;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    EmailService emailService;

    @Autowired
    Blockchain blockchain;

    @Autowired
    RefreshTokenService refreshTokenService;

    @Value("${securevault.app.jwtExpirationMs}")
    private Long jwtExpirationMs;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        // 2FA Implementation
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId()).orElseThrow();

        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        try {
            emailService.sendOtpMessage(user.getEmail(), "SecureVault Login OTP", "Your OTP is: " + otp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Error sending email: " + e.getMessage()));
        }

        return ResponseEntity.ok(new MessageResponse("OTP sent to your email. Please verify."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest verifyOtpRequest) {
        User user = userRepository.findByUsername(verifyOtpRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP request"));
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            return ResponseEntity.badRequest().body(new MessageResponse("OTP expired"));
        }

        if (!user.getOtpCode().equals(verifyOtpRequest.getOtp())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP"));
        }

        // Clear OTP
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        // Generate Access Token
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        // Generate Refresh Token
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        // Log to Blockchain
        blockchain.addBlock("User " + user.getUsername() + " logged in via 2FA");

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                refreshToken.getToken(),
                jwtExpirationMs,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody ResendOtpRequest request) {
        User user = null;
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            user = userRepository.findByUsername(request.getUsername()).orElse(null);
        } else if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user = userRepository.findByEmail(request.getEmail()).orElse(null);
        }

        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }

        // Rate limit check simply by checking if existing OTP expiry is too far in
        // future?
        // Actually, let's just generate a new one. Frontend handles the UI timer.
        // Backend could enforce time check if we stored 'lastOtpSentAt', but
        // simplifying for now.

        // Generate OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Send Email
        try {
            emailService.sendOtpMessage(user.getEmail(), "SecureVault OTP Resend",
                    "Your new OTP is: " + otp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Error sending email: " + e.getMessage()));
        }

        return ResponseEntity.ok(new MessageResponse("OTP resent to your email."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        if (!userRepository.existsByEmail(request.getEmail())) {
            // Don't reveal if user exists or not for security, but for this demo clean
            // feedback is better
            // Ideally return OK even if email not found to prevent enumeration
            return ResponseEntity.ok(new MessageResponse("If email exists, OTP has been sent."));
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        // Generate OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10)); // 10 minutes expiry for reset
        userRepository.save(user);

        // Send Email
        try {
            emailService.sendOtpMessage(user.getEmail(), "SecureVault Password Reset OTP",
                    "Your OTP for password reset is: " + otp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new MessageResponse("Error sending email: " + e.getMessage()));
        }

        // Log to Blockchain
        blockchain.addBlock("Password reset requested for: " + user.getUsername());

        return ResponseEntity.ok(new MessageResponse("OTP sent to your email for password reset."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid request"));
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            return ResponseEntity.badRequest().body(new MessageResponse("OTP expired"));
        }

        if (!user.getOtpCode().equals(request.getOtp())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid OTP"));
        }

        // Update Password
        user.setPassword(encoder.encode(request.getNewPassword()));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        // Log to Blockchain
        blockchain.addBlock("Password reset successful for: " + user.getUsername());

        return ResponseEntity.ok(new MessageResponse("Password changed successfully! You can now login."));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    // Generate new access token
                    UserDetailsImpl userDetails = UserDetailsImpl.build(user);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    String token = jwtUtils.generateJwtToken(authentication);

                    // Create new refresh token (rotate)
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());

                    // Log to Blockchain
                    blockchain.addBlock("User " + user.getUsername() + " refreshed access token");

                    return ResponseEntity
                            .ok(new TokenRefreshResponse(token, newRefreshToken.getToken(), jwtExpirationMs));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            refreshTokenService.deleteByUserId(userDetails.getId());

            // Log to Blockchain
            blockchain.addBlock("User " + userDetails.getUsername() + " logged out");
        }

        return ResponseEntity.ok(new MessageResponse("Log out successful!"));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .fullName(signUpRequest.getFullName())
                .phoneNumber(signUpRequest.getPhoneNumber())
                .nationalId(signUpRequest.getNationalId())
                .isEnabled(true)
                .build();

        // Force default role to STAFF as per new requirement
        user.setRole(Role.ROLE_STAFF);
        userRepository.save(user);

        // Log to Blockchain
        blockchain.addBlock("New user registered: " + user.getUsername());

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}
