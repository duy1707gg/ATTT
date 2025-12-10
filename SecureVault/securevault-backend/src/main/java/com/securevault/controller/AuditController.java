package com.securevault.controller;

import com.securevault.blockchain.Block;
import com.securevault.blockchain.Blockchain;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    @Autowired
    private Blockchain blockchain;

    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Block>> getAuditLogs() {
        // Reload from database to ensure we see any manual tampering immediately
        blockchain.reloadChain();
        return ResponseEntity.ok(blockchain.getChain());
    }

    @GetMapping("/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> verifyChain() {
        boolean isValid = blockchain.isChainValid();
        return ResponseEntity.ok(isValid ? "Blockchain is VALID" : "Blockchain is INVALID (Tampered)");
    }

    /**
     * Get detailed verification result including tampered block information
     */
    @GetMapping("/verify-details")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> verifyChainWithDetails() {
        return ResponseEntity.ok(blockchain.validateWithDetails());
    }

    /**
     * Delete tampered block and all subsequent blocks for recovery
     */
    @DeleteMapping("/fix/{blockIndex}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> fixTamperedBlock(@PathVariable int blockIndex) {
        return ResponseEntity.ok(blockchain.deleteTamperedBlock(blockIndex));
    }

    /**
     * Rebuild entire blockchain - use when all blocks are corrupted
     */
    @PostMapping("/rebuild")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> rebuildBlockchain() {
        return ResponseEntity.ok(blockchain.rebuildBlockchain());
    }
}
