package com.securevault.controller;

import com.securevault.entity.User;
import com.securevault.enums.Role;
import com.securevault.repository.UserRepository;
import com.securevault.payload.request.SignupRequest;
import com.securevault.payload.request.UpdateProfileRequest;
import com.securevault.payload.response.MessageResponse;
import com.securevault.blockchain.Blockchain;
import com.securevault.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private Blockchain blockchain;

    // Admin: List all users
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // Admin: Create new user
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Email is already in use!"));
        }

        User user = User.builder()
                .username(signUpRequest.getUsername())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .fullName(signUpRequest.getFullName())
                .phoneNumber(signUpRequest.getPhoneNumber())
                .nationalId(signUpRequest.getNationalId())
                .isEnabled(true)
                .build();

        // Admin can assign roles if we wanted, but for now defaulting to STAFF or based
        // on request
        // Re-using logic: Admin creating user might want to specify role
        Set<String> strRoles = signUpRequest.getRole();
        Role role = Role.ROLE_STAFF;

        if (strRoles != null && !strRoles.isEmpty()) {
            String roleName = strRoles.iterator().next();
            switch (roleName.toLowerCase()) {
                case "admin":
                    role = Role.ROLE_ADMIN;
                    break;
                case "manager":
                    role = Role.ROLE_MANAGER;
                    break;
                default:
                    role = Role.ROLE_STAFF;
            }
        }
        user.setRole(role);
        userRepository.save(user);

        blockchain.addBlock("Admin created user: " + user.getUsername());

        return ResponseEntity.ok(new MessageResponse("User created successfully!"));
    }

    // Admin: Delete user
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(user);
        blockchain.addBlock("Admin deleted user: " + user.getUsername());

        return ResponseEntity.ok(new MessageResponse("User deleted successfully!"));
    }

    // Admin: Toggle status
    @PutMapping("/status/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestParam boolean enabled) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEnabled(enabled);
        userRepository.save(user);

        return ResponseEntity.ok("User " + (enabled ? "enabled" : "disabled"));
    }

    // Authenticated User: Get Profile
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getProfile() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    // Authenticated User: Update Profile
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setNationalId(request.getNationalId());

        userRepository.save(user);
        blockchain.addBlock("User updated profile: " + user.getUsername());

        return ResponseEntity.ok(new MessageResponse("Profile updated successfully!"));
    }
}
