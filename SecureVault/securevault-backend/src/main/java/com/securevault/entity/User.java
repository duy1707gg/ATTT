package com.securevault.entity;

import com.securevault.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    private String fullName;

    // Sensitive data (will be encrypted later)
    @Convert(converter = com.securevault.converter.AttributeEncryptor.class)
    private String phoneNumber;

    @Convert(converter = com.securevault.converter.AttributeEncryptor.class)
    private String nationalId;

    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean isEnabled; // For email verification

    // 2FA
    private String otpCode;
    private LocalDateTime otpExpiry;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
