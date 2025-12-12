package com.securevault.controller;

import com.securevault.blockchain.Blockchain;
import com.securevault.entity.FileDocument;
import com.securevault.security.services.UserDetailsImpl;
import com.securevault.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Controller xử lý các request quản lý file.
 * Chỉ xử lý HTTP request/response, business logic nằm trong FileStorageService.
 */
@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    private final FileStorageService fileStorageService;
    private final Blockchain blockchain;

    public FileController(FileStorageService fileStorageService, Blockchain blockchain) {
        this.fileStorageService = fileStorageService;
        this.blockchain = blockchain;
    }

    /**
     * Upload file mới.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            Long userId = getCurrentUserId();
            String username = getCurrentUsername();

            FileDocument fileDocument = fileStorageService.storeFile(file, userId);
            blockchain.addBlock("Người dùng " + username + " đã tải lên file: " + fileDocument.getFileName());

            return ResponseEntity.ok("Tải file thành công: " + fileDocument.getFileName());
        } catch (Exception e) {
            logger.error("Lỗi tải file: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Không thể tải file: " + e.getMessage());
        }
    }

    /**
     * Upload file vào thư mục.
     */
    @PostMapping("/upload-to-folder")
    public ResponseEntity<?> uploadFileToFolder(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folderId", required = false) Long folderId) {
        try {
            Long userId = getCurrentUserId();
            String username = getCurrentUsername();

            FileDocument fileDocument = fileStorageService.storeFileInFolder(file, userId, folderId);
            blockchain.addBlock("Người dùng " + username + " đã tải lên file: " + fileDocument.getFileName());

            return ResponseEntity.ok("Tải file thành công: " + fileDocument.getFileName());
        } catch (Exception e) {
            logger.error("Lỗi tải file: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Không thể tải file: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách file của người dùng hiện tại.
     */
    @GetMapping("/list")
    public ResponseEntity<List<FileDocument>> listFiles() {
        Long userId = getCurrentUserId();
        List<FileDocument> files = fileStorageService.getAllFiles(userId);
        return ResponseEntity.ok(files);
    }

    /**
     * Lấy danh sách file được chia sẻ với người dùng hiện tại.
     */
    @GetMapping("/shared")
    public ResponseEntity<?> listSharedFiles() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(fileStorageService.getSharedFilesWithDetails(userId));
    }

    /**
     * Lấy danh sách file chờ duyệt (Manager only).
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> listPendingFiles() {
        return ResponseEntity.ok(fileStorageService.getPendingFilesWithDetails());
    }

    /**
     * Chia sẻ file với một người dùng.
     */
    @PostMapping("/share/{id}")
    public ResponseEntity<?> shareFile(@PathVariable Long id, @RequestParam String username) {
        try {
            fileStorageService.shareFile(id, username);
            return ResponseEntity.ok("Chia sẻ file thành công với " + username);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi chia sẻ file: " + e.getMessage());
        }
    }

    /**
     * Chia sẻ file với nhiều người dùng qua email.
     */
    @PostMapping("/share-multiple/{id}")
    public ResponseEntity<?> shareFileMultiple(@PathVariable Long id, @RequestBody List<String> emails) {
        try {
            Map<String, Object> result = fileStorageService.shareFileWithMultipleUsers(id, emails);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi chia sẻ file: " + e.getMessage());
        }
    }

    /**
     * Duyệt hoặc từ chối file (Manager only).
     */
    @PutMapping("/approve/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> approveFile(@PathVariable Long id, @RequestParam boolean approved) {
        try {
            fileStorageService.approveFile(id, approved);
            String status = approved ? "được duyệt" : "bị từ chối";
            return ResponseEntity.ok("File đã " + status);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật trạng thái file: " + e.getMessage());
        }
    }

    /**
     * Tải file xuống.
     */
    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            logger.info("Download request: fileId={}, userId={}", id, userId);

            // Kiểm tra quyền truy cập: owner, file share, hoặc folder share
            boolean hasAccess = fileStorageService.canUserAccessFile(id, userId);
            logger.info("Access check for fileId={}: hasAccess={}", id, hasAccess);

            if (!hasAccess) {
                logger.warn("Access denied for fileId={}, userId={}", id, userId);
                return ResponseEntity.status(403).build();
            }

            FileDocument fileDocument = fileStorageService.getFile(id);
            logger.info("Loading file: {}, path: {}", fileDocument.getFileName(), fileDocument.getEncryptedPath());

            Resource resource = fileStorageService.loadDecryptedFileAsResource(id);
            logger.info("File loaded successfully: {}", fileDocument.getFileName());

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(fileDocument.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileDocument.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            logger.error("Lỗi tải file id={}: {} - {}", id, e.getClass().getSimpleName(), e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Xóa file.
     */
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            String username = getCurrentUsername();

            FileDocument fileDocument = fileStorageService.getFile(id);

            // Kiểm tra quyền sở hữu
            if (!fileDocument.getOwner().getId().equals(userId)) {
                return ResponseEntity.status(403).body("Bạn không có quyền xóa file này");
            }

            String fileName = fileDocument.getFileName();
            fileStorageService.deleteFile(id);
            blockchain.addBlock("Người dùng " + username + " đã xóa file: " + fileName);

            return ResponseEntity.ok("Đã xóa file thành công: " + fileName);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xóa file: " + e.getMessage());
        }
    }

    // ==================== Private Helper Methods ====================

    private Long getCurrentUserId() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userDetails.getId();
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getUsername();
    }
}
