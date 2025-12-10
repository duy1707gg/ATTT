package com.securevault.controller;

import com.securevault.entity.FileDocument;
import com.securevault.security.services.UserDetailsImpl;
import com.securevault.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private com.securevault.blockchain.Blockchain blockchain;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            FileDocument fileDocument = fileStorageService.storeFile(file, userDetails.getId());

            // Log to Blockchain
            blockchain.addBlock("User " + userDetails.getUsername() + " uploaded file: " + fileDocument.getFileName());

            return ResponseEntity.ok("File uploaded successfully: " + fileDocument.getFileName());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Could not upload the file: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<FileDocument>> listFiles() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        List<FileDocument> files = fileStorageService.getAllFiles(userDetails.getId());
        return ResponseEntity.ok(files);
    }

    @GetMapping("/shared")
    public ResponseEntity<?> listSharedFiles() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        return ResponseEntity.ok(fileStorageService.getSharedFilesWithDetails(userDetails.getId()));
    }

    @GetMapping("/pending")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> listPendingFiles() {
        return ResponseEntity.ok(fileStorageService.getPendingFilesWithDetails());
    }

    @PostMapping("/share/{id}")
    public ResponseEntity<?> shareFile(@PathVariable Long id, @RequestParam String username) {
        try {
            fileStorageService.shareFile(id, username);
            return ResponseEntity.ok("File shared successfully with " + username);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error sharing file: " + e.getMessage());
        }
    }

    @PostMapping("/share-multiple/{id}")
    public ResponseEntity<?> shareFileMultiple(@PathVariable Long id, @RequestBody java.util.List<String> emails) {
        try {
            java.util.Map<String, Object> result = fileStorageService.shareFileWithMultipleUsers(id, emails);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error sharing file: " + e.getMessage());
        }
    }

    @PutMapping("/approve/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> approveFile(@PathVariable Long id, @RequestParam boolean approved) {
        try {
            fileStorageService.approveFile(id, approved);
            return ResponseEntity.ok("File " + (approved ? "approved" : "rejected"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating file status: " + e.getMessage());
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        try {
            FileDocument fileDocument = fileStorageService.getFile(id);
            Resource resource = fileStorageService.loadDecryptedFileAsResource(id);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(fileDocument.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileDocument.getFileName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

            FileDocument fileDocument = fileStorageService.getFile(id);

            // Check if the user is the owner of the file
            if (!fileDocument.getOwner().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(403).body("Bạn không có quyền xóa tệp này");
            }

            String fileName = fileDocument.getFileName();
            fileStorageService.deleteFile(id);

            // Log to Blockchain
            blockchain.addBlock("User " + userDetails.getUsername() + " deleted file: " + fileName);

            return ResponseEntity.ok("Đã xóa tệp thành công: " + fileName);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xóa tệp: " + e.getMessage());
        }
    }
}
