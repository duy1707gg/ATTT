package com.securevault.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "files")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    private String fileType;

    private long size;

    @Column(nullable = false)
    private String encryptedPath; // Path to the encrypted file on disk

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User owner;

    @CreationTimestamp
    private LocalDateTime uploadedAt;

    // For Module 2: Encryption Key (if per-file key) or IV
    private String encryptionIv;

    @Enumerated(EnumType.STRING)
    private com.securevault.enums.FileStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Folder folder;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "file_shares", joinColumns = @JoinColumn(name = "file_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.Set<User> sharedWith = new java.util.HashSet<>();
}
