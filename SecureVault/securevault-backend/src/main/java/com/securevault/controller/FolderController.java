package com.securevault.controller;

import com.securevault.dto.FolderDTO;
import com.securevault.entity.FileDocument;
import com.securevault.entity.Folder;
import com.securevault.security.services.UserDetailsImpl;
import com.securevault.service.FileStorageService;
import com.securevault.service.FolderService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Controller quản lý thư mục.
 */
@RestController
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService folderService;
    private final FileStorageService fileStorageService;

    public FolderController(FolderService folderService, FileStorageService fileStorageService) {
        this.folderService = folderService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Tạo thư mục mới.
     */
    @PostMapping
    public ResponseEntity<?> createFolder(@RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("name");
            Long parentId = request.get("parentId") != null ? Long.valueOf(request.get("parentId").toString()) : null;

            FolderDTO folder = folderService.createFolder(name, parentId, getCurrentUserId());
            return ResponseEntity.ok(folder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo thư mục: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách thư mục.
     */
    @GetMapping
    public ResponseEntity<List<FolderDTO>> getFolders(
            @RequestParam(required = false) Long parentId) {
        List<FolderDTO> folders = folderService.getFolders(parentId, getCurrentUserId());
        return ResponseEntity.ok(folders);
    }

    /**
     * Lấy thông tin thư mục.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getFolder(@PathVariable Long id) {
        try {
            FolderDTO folder = folderService.getFolder(id, getCurrentUserId());
            return ResponseEntity.ok(folder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Đổi tên thư mục.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> renameFolder(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String newName = request.get("name");
            FolderDTO folder = folderService.renameFolder(id, newName, getCurrentUserId());
            return ResponseEntity.ok(folder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi đổi tên thư mục: " + e.getMessage());
        }
    }

    /**
     * Xóa thư mục.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFolder(@PathVariable Long id) {
        try {
            folderService.deleteFolder(id, getCurrentUserId());
            return ResponseEntity.ok("Đã xóa thư mục thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi xóa thư mục: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách files trong thư mục.
     */
    @GetMapping("/{id}/files")
    public ResponseEntity<List<FileDocument>> getFilesInFolder(@PathVariable Long id) {
        Long folderId = id == 0 ? null : id;
        List<FileDocument> files = folderService.getFilesInFolder(folderId, getCurrentUserId());
        return ResponseEntity.ok(files);
    }

    /**
     * Lấy files ở root (không thuộc thư mục nào).
     */
    @GetMapping("/root/files")
    public ResponseEntity<List<FileDocument>> getRootFiles() {
        List<FileDocument> files = folderService.getFilesInFolder(null, getCurrentUserId());
        return ResponseEntity.ok(files);
    }

    /**
     * Di chuyển file vào thư mục.
     */
    @PutMapping("/move-file")
    public ResponseEntity<?> moveFileToFolder(@RequestBody Map<String, Long> request) {
        try {
            Long fileId = request.get("fileId");
            Long folderId = request.get("folderId");
            folderService.moveFileToFolder(fileId, folderId, getCurrentUserId());
            return ResponseEntity.ok("Đã di chuyển file thành công");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi di chuyển file: " + e.getMessage());
        }
    }

    /**
     * Lấy breadcrumb path.
     */
    @GetMapping("/{id}/breadcrumb")
    public ResponseEntity<List<FolderDTO>> getBreadcrumb(@PathVariable Long id) {
        Long folderId = id == 0 ? null : id;
        List<FolderDTO> breadcrumb = folderService.getBreadcrumb(folderId, getCurrentUserId());
        return ResponseEntity.ok(breadcrumb);
    }

    /**
     * Chia sẻ thư mục với nhiều người dùng.
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<?> shareFolder(@PathVariable Long id, @RequestBody List<String> emails) {
        try {
            folderService.shareFolderWithMultipleUsers(id, emails, getCurrentUserId());
            return ResponseEntity.ok("Đã chia sẻ thư mục thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi chia sẻ thư mục: " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách thư mục được chia sẻ với user hiện tại.
     */
    @GetMapping("/shared")
    public ResponseEntity<?> getSharedFolders() {
        try {
            return ResponseEntity.ok(folderService.getSharedFolders(getCurrentUserId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Lấy files trong thư mục được chia sẻ.
     */
    @GetMapping("/shared/{id}/files")
    public ResponseEntity<?> getFilesInSharedFolder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(folderService.getFilesInSharedFolder(id, getCurrentUserId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    /**
     * Tải thư mục của mình dưới dạng ZIP.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<StreamingResponseBody> downloadFolderAsZip(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            Folder folder = folderService.getFolderEntity(id, userId);
            List<FileDocument> files = folderService.getFilesInOwnedFolder(id, userId);

            if (files.isEmpty()) {
                return ResponseEntity.noContent().build();
            }

            String zipFileName = folder.getName() + ".zip";

            StreamingResponseBody stream = outputStream -> {
                try (ZipOutputStream zipOut = new ZipOutputStream(outputStream)) {
                    for (FileDocument file : files) {
                        try {
                            Resource resource = fileStorageService.loadDecryptedFileAsResource(file.getId());
                            ZipEntry zipEntry = new ZipEntry(file.getFileName());
                            zipOut.putNextEntry(zipEntry);
                            resource.getInputStream().transferTo(zipOut);
                            zipOut.closeEntry();
                        } catch (Exception e) {
                            // Skip files that can't be loaded
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Lỗi tạo file ZIP", e);
                }
            };

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + zipFileName + "\"")
                    .body(stream);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Tải thư mục được chia sẻ dưới dạng ZIP.
     */
    @GetMapping("/shared/{id}/download")
    public ResponseEntity<StreamingResponseBody> downloadSharedFolderAsZip(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            Folder folder = folderService.getSharedFolderEntity(id, userId);
            List<FileDocument> files = folderService.getFilesInSharedFolder(id, userId);

            if (files.isEmpty()) {
                return ResponseEntity.noContent().build();
            }

            String zipFileName = folder.getName() + ".zip";

            StreamingResponseBody stream = outputStream -> {
                try (ZipOutputStream zipOut = new ZipOutputStream(outputStream)) {
                    for (FileDocument file : files) {
                        try {
                            Resource resource = fileStorageService.loadDecryptedFileAsResource(file.getId());
                            ZipEntry zipEntry = new ZipEntry(file.getFileName());
                            zipOut.putNextEntry(zipEntry);
                            resource.getInputStream().transferTo(zipOut);
                            zipOut.closeEntry();
                        } catch (Exception e) {
                            // Skip files that can't be loaded
                        }
                    }
                } catch (IOException e) {
                    throw new RuntimeException("Lỗi tạo file ZIP", e);
                }
            };

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + zipFileName + "\"")
                    .body(stream);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private Long getCurrentUserId() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return userDetails.getId();
    }
}
