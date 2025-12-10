package com.securevault.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * JPA Entity for storing blockchain blocks persistently in the database.
 * Each block contains an audit log entry that cannot be modified.
 */
@Entity
@Table(name = "blockchain_blocks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "block_index", nullable = false)
    private int blockIndex;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Store the exact timestamp string used for hash calculation
    // This ensures hash recalculation produces the same result
    @Column(name = "timestamp_str", length = 50)
    private String timestampStr;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String data; // The audit log message

    @Column(name = "previous_hash", nullable = false, length = 64)
    private String previousHash;

    @Column(name = "hash", nullable = false, length = 64)
    private String hash;

    @Column(nullable = false)
    private int nonce;
}
