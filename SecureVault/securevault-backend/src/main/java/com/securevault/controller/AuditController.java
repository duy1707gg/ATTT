package com.securevault.controller;

import com.securevault.blockchain.Block;
import com.securevault.blockchain.Blockchain;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller quản lý audit log blockchain.
 * Chỉ Admin có quyền truy cập.
 */
@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final Blockchain blockchain;

    public AuditController(Blockchain blockchain) {
        this.blockchain = blockchain;
    }

    /**
     * Lấy toàn bộ audit logs từ blockchain.
     */
    @GetMapping("/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Block>> getAuditLogs() {
        blockchain.reloadChain();
        return ResponseEntity.ok(blockchain.getChain());
    }

    /**
     * Kiểm tra tính toàn vẹn của blockchain.
     */
    @GetMapping("/verify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> verifyChain() {
        boolean isValid = blockchain.isChainValid();
        String message = isValid ? "Blockchain HỢP LỆ" : "Blockchain KHÔNG HỢP LỆ (Bị giả mạo)";
        return ResponseEntity.ok(message);
    }

    /**
     * Kiểm tra chi tiết blockchain, bao gồm thông tin các block bị giả mạo.
     */
    @GetMapping("/verify-details")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> verifyChainWithDetails() {
        return ResponseEntity.ok(blockchain.validateWithDetails());
    }

    /**
     * Xóa block bị giả mạo và các block sau đó để khôi phục.
     */
    @DeleteMapping("/fix/{blockIndex}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> fixTamperedBlock(@PathVariable int blockIndex) {
        return ResponseEntity.ok(blockchain.deleteTamperedBlock(blockIndex));
    }

    /**
     * Xây dựng lại toàn bộ blockchain - sử dụng khi tất cả block bị hỏng.
     */
    @PostMapping("/rebuild")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> rebuildBlockchain() {
        return ResponseEntity.ok(blockchain.rebuildBlockchain());
    }
}
