package com.securevault.controller;

import com.securevault.entity.User;
import com.securevault.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/test")
public class TestController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @GetMapping("/debug-password")
    public ResponseEntity<?> debugPassword(@RequestParam String username, @RequestParam String rawPassword) {
        try {
            User user = userRepository.findByUsername(username)
                    .orElseGet(() -> userRepository.findByEmail(username)
                            .orElseThrow(
                                    () -> new RuntimeException("User not found with username/email: " + username)));

            String storedHash = user.getPassword();
            boolean matches = passwordEncoder.matches(rawPassword, storedHash);

            Map<String, Object> result = new HashMap<>();
            result.put("foundUser", user.getUsername());
            result.put("email", user.getEmail());
            result.put("storedHash", storedHash);
            result.put("matches", matches);
            result.put("encoderClass", passwordEncoder.getClass().getName());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getClass().getName());
            error.put("message", e.getMessage());
            e.printStackTrace(); // Print to console for server logs
            return ResponseEntity.internalServerError().body(error);
        }
    }
}
