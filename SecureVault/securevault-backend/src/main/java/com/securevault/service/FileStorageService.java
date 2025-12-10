package com.securevault.service;

import com.securevault.dto.PendingFileDTO;
import com.securevault.dto.SharedFileDTO;
import com.securevault.entity.FileDocument;
import com.securevault.entity.FileShare;
import com.securevault.entity.User;
import com.securevault.enums.FileStatus;
import com.securevault.enums.Role;
import com.securevault.repository.FileRepository;
import com.securevault.repository.FileShareRepository;
import com.securevault.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xử lý lưu trữ và quản lý file.
 * Bao gồm: upload, download, chia sẻ, duyệt file.
 */
@Service
@Transactional
public class FileStorageService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileShareRepository fileShareRepository;
    private final EncryptionService encryptionService;
    private final EmailService emailService;

    @Value("${securevault.app.uploadDir}")
    private String uploadDir;

    public FileStorageService(FileRepository fileRepository,
            UserRepository userRepository,
            FileShareRepository fileShareRepository,
            EncryptionService encryptionService,
            EmailService emailService) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.fileShareRepository = fileShareRepository;
        this.encryptionService = encryptionService;
        this.emailService = emailService;
    }

    /**
     * Lưu file mới với mã hóa AES-GCM.
     */
    public FileDocument storeFile(MultipartFile file, Long userId) throws Exception {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileExtension = extractFileExtension(originalFileName);
        String storageFileName = UUID.randomUUID() + (fileExtension.isEmpty() ? "" : "." + fileExtension);

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(storageFileName);
        Path tempPath = uploadPath.resolve("temp_" + storageFileName);

        // Lưu file tạm
        Files.copy(file.getInputStream(), tempPath, StandardCopyOption.REPLACE_EXISTING);

        // Mã hóa file
        String iv = encryptionService.generateIv();
        encryptionService.encryptFile(tempPath, filePath, iv);

        // Xóa file tạm
        Files.delete(tempPath);

        // Xác định trạng thái dựa theo role
        FileStatus status = (user.getRole() == Role.ROLE_STAFF) ? FileStatus.PENDING : FileStatus.APPROVED;

        FileDocument fileDocument = FileDocument.builder()
                .fileName(originalFileName)
                .fileType(file.getContentType())
                .size(file.getSize())
                .encryptedPath(filePath.toString())
                .owner(user)
                .encryptionIv(iv)
                .status(status)
                .build();

        FileDocument savedFile = fileRepository.save(fileDocument);

        // Gửi email thông báo cho Manager khi file chờ duyệt
        if (status == FileStatus.PENDING) {
            notifyManagersAboutPendingFile(savedFile.getFileName(), user.getUsername());
        }

        return savedFile;
    }

    /**
     * Chia sẻ file với người dùng theo username.
     */
    public void shareFile(Long fileId, String username) {
        FileDocument file = getFile(fileId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        file.getSharedWith().add(user);
        fileRepository.save(file);
    }

    /**
     * Chia sẻ file với nhiều người dùng theo email.
     */
    public Map<String, Object> shareFileWithMultipleUsers(Long fileId, List<String> emails) {
        FileDocument file = getFile(fileId);
        List<String> successEmails = new ArrayList<>();
        List<String> notFoundEmails = new ArrayList<>();

        for (String email : emails) {
            String trimmedEmail = email.trim();
            if (trimmedEmail.isEmpty())
                continue;

            Optional<User> userOpt = userRepository.findByEmail(trimmedEmail);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (!fileShareRepository.existsByFileIdAndSharedWithUserId(fileId, user.getId())) {
                    // Đặt ngày hết hạn là 3 tháng kể từ ngày chia sẻ
                    LocalDateTime expiresAt = LocalDateTime.now().plusMonths(3);
                    FileShare fileShare = FileShare.builder()
                            .file(file)
                            .sharedWithUser(user)
                            .expiresAt(expiresAt)
                            .build();
                    fileShareRepository.save(fileShare);
                    file.getSharedWith().add(user);
                }
                successEmails.add(trimmedEmail);
            } else {
                notFoundEmails.add(trimmedEmail);
            }
        }

        if (!successEmails.isEmpty()) {
            fileRepository.save(file);

            // Gửi email thông báo cho từng người nhận
            String sharerName = file.getOwner().getUsername();
            for (String email : successEmails) {
                emailService.sendFileSharedNotification(email, file.getFileName(), sharerName);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successEmails.size());
        result.put("successEmails", successEmails);
        result.put("notFoundEmails", notFoundEmails);
        return result;
    }

    /**
     * Duyệt hoặc từ chối file.
     */
    public void approveFile(Long fileId, boolean approved) {
        FileDocument file = getFile(fileId);
        file.setStatus(approved ? FileStatus.APPROVED : FileStatus.REJECTED);
        fileRepository.save(file);
    }

    /**
     * Lấy thông tin file theo ID.
     */
    public FileDocument getFile(Long fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file với id " + fileId));
    }

    /**
     * Lấy danh sách file của người dùng.
     */
    public List<FileDocument> getAllFiles(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return fileRepository.findByOwner(user);
    }

    /**
     * Lấy danh sách file được chia sẻ với người dùng.
     */
    public List<FileDocument> getSharedFiles(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return fileRepository.findBySharedWithContaining(user);
    }

    /**
     * Lấy danh sách file được chia sẻ với chi tiết người chia sẻ (chỉ lấy những
     * file chưa hết hạn).
     */
    public List<SharedFileDTO> getSharedFilesWithDetails(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        // Chỉ lấy những share chưa hết hạn
        List<FileShare> fileShares = fileShareRepository.findBySharedWithUserAndExpiresAtAfter(user,
                LocalDateTime.now());

        return fileShares.stream().map(fs -> {
            FileDocument file = fs.getFile();
            User owner = file.getOwner();
            return SharedFileDTO.builder()
                    .id(file.getId())
                    .fileName(file.getFileName())
                    .fileType(file.getFileType())
                    .size(file.getSize())
                    .status(file.getStatus() != null ? file.getStatus().name() : "PENDING")
                    .uploadedAt(file.getUploadedAt())
                    .sharedAt(fs.getSharedAt())
                    .expiresAt(fs.getExpiresAt())
                    .ownerUsername(owner != null ? owner.getUsername() : "Không xác định")
                    .ownerEmail(owner != null ? owner.getEmail() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Lấy danh sách file chờ duyệt.
     */
    public List<FileDocument> getPendingFiles() {
        return fileRepository.findByStatus(FileStatus.PENDING);
    }

    /**
     * Lấy danh sách file chờ duyệt với chi tiết người tải lên.
     */
    public List<PendingFileDTO> getPendingFilesWithDetails() {
        List<FileDocument> pendingFiles = fileRepository.findByStatus(FileStatus.PENDING);

        return pendingFiles.stream().map(file -> {
            User owner = file.getOwner();
            return PendingFileDTO.builder()
                    .id(file.getId())
                    .fileName(file.getFileName())
                    .fileType(file.getFileType())
                    .size(file.getSize())
                    .status(file.getStatus() != null ? file.getStatus().name() : "PENDING")
                    .uploadedAt(file.getUploadedAt())
                    .ownerUsername(owner != null ? owner.getUsername() : "Không xác định")
                    .ownerEmail(owner != null ? owner.getEmail() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Giải mã file và trả về resource.
     */
    public Resource loadDecryptedFileAsResource(Long fileId) throws Exception {
        FileDocument fileDocument = getFile(fileId);
        Path filePath = Paths.get(fileDocument.getEncryptedPath());

        String tempFileName = "decrypted_" + UUID.randomUUID() + "_" + fileDocument.getFileName();
        Path tempPath = Paths.get(uploadDir).resolve(tempFileName);

        encryptionService.decryptFile(filePath, tempPath, fileDocument.getEncryptionIv());

        Resource resource = new UrlResource(tempPath.toUri());
        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Không thể đọc file!");
        }
    }

    /**
     * Xóa file.
     */
    public void deleteFile(Long fileId) throws Exception {
        FileDocument fileDocument = getFile(fileId);

        Path filePath = Paths.get(fileDocument.getEncryptedPath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }

        fileRepository.delete(fileDocument);
    }

    // ==================== Private Helper Methods ====================

    private String extractFileExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1) : "";
    }

    /**
     * Gửi email thông báo cho tất cả Manager khi có file chờ duyệt.
     */
    private void notifyManagersAboutPendingFile(String fileName, String uploaderName) {
        List<User> managers = userRepository.findByRole(Role.ROLE_MANAGER);
        for (User manager : managers) {
            if (manager.getEmail() != null && !manager.getEmail().isEmpty()) {
                emailService.sendFilePendingNotification(manager.getEmail(), fileName, uploaderName);
            }
        }
    }
}
