package com.securevault.service;

import com.securevault.dto.SharedFileDTO;
import com.securevault.entity.FileDocument;
import com.securevault.entity.FileShare;
import com.securevault.entity.User;
import com.securevault.repository.FileRepository;
import com.securevault.repository.FileShareRepository;
import com.securevault.repository.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class FileStorageService {

    @Value("${securevault.app.uploadDir}")
    private String uploadDir;

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileShareRepository fileShareRepository;

    @Autowired
    private EncryptionService encryptionService;

    public FileDocument storeFile(MultipartFile file, Long userId) throws Exception {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        // Normalize file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            fileExtension = originalFileName.substring(i + 1);
        }

        // Generate unique file name for storage
        String storageFileName = UUID.randomUUID().toString() + (fileExtension.isEmpty() ? "" : "." + fileExtension);

        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(storageFileName);

        // Save temp file
        Path tempPath = uploadPath.resolve("temp_" + storageFileName);
        Files.copy(file.getInputStream(), tempPath, StandardCopyOption.REPLACE_EXISTING);

        // Encrypt file
        String iv = encryptionService.generateIv();
        encryptionService.encryptFile(tempPath, filePath, iv);

        // Delete temp file
        Files.delete(tempPath);

        // Set Status
        com.securevault.enums.FileStatus status = com.securevault.enums.FileStatus.APPROVED;
        if (user.getRole() == com.securevault.enums.Role.ROLE_STAFF) {
            status = com.securevault.enums.FileStatus.PENDING;
        }

        FileDocument fileDocument = FileDocument.builder()
                .fileName(originalFileName)
                .fileType(file.getContentType())
                .size(file.getSize())
                .encryptedPath(filePath.toString())
                .owner(user)
                .encryptionIv(iv)
                .status(status)
                .build();

        return fileRepository.save(fileDocument);
    }

    public void shareFile(Long fileId, String username) {
        FileDocument file = getFile(fileId);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        file.getSharedWith().add(user);
        fileRepository.save(file);
    }

    /**
     * Share file with multiple users by their emails
     * Returns a map with success count and list of not found emails
     */
    public java.util.Map<String, Object> shareFileWithMultipleUsers(Long fileId, java.util.List<String> emails) {
        FileDocument file = getFile(fileId);
        java.util.List<String> successEmails = new java.util.ArrayList<>();
        java.util.List<String> notFoundEmails = new java.util.ArrayList<>();

        for (String email : emails) {
            String trimmedEmail = email.trim();
            if (trimmedEmail.isEmpty())
                continue;

            java.util.Optional<User> userOpt = userRepository.findByEmail(trimmedEmail);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                // Check if already shared
                if (!fileShareRepository.existsByFileIdAndSharedWithUserId(fileId, user.getId())) {
                    // Create FileShare record with timestamp
                    FileShare fileShare = FileShare.builder()
                            .file(file)
                            .sharedWithUser(user)
                            .build();
                    fileShareRepository.save(fileShare);

                    // Also add to legacy ManyToMany for compatibility
                    file.getSharedWith().add(user);
                }
                successEmails.add(trimmedEmail);
            } else {
                notFoundEmails.add(trimmedEmail);
            }
        }

        if (!successEmails.isEmpty()) {
            fileRepository.save(file);
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("successCount", successEmails.size());
        result.put("successEmails", successEmails);
        result.put("notFoundEmails", notFoundEmails);
        return result;
    }

    public void approveFile(Long fileId, boolean approved) {
        FileDocument file = getFile(fileId);
        file.setStatus(
                approved ? com.securevault.enums.FileStatus.APPROVED : com.securevault.enums.FileStatus.REJECTED);
        fileRepository.save(file);
    }

    public FileDocument getFile(Long fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id " + fileId));
    }

    public List<FileDocument> getAllFiles(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return fileRepository.findByOwner(user);
    }

    public List<FileDocument> getSharedFiles(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return fileRepository.findBySharedWithContaining(user);
    }

    /**
     * Get shared files with details including owner info and share date
     */
    public List<SharedFileDTO> getSharedFilesWithDetails(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        List<FileShare> fileShares = fileShareRepository.findBySharedWithUser(user);

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
                    .ownerUsername(owner != null ? owner.getUsername() : "Không xác định")
                    .ownerEmail(owner != null ? owner.getEmail() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    public List<FileDocument> getPendingFiles() {
        return fileRepository.findByStatus(com.securevault.enums.FileStatus.PENDING);
    }

    /**
     * Get pending files with owner details
     */
    public List<com.securevault.dto.PendingFileDTO> getPendingFilesWithDetails() {
        List<FileDocument> pendingFiles = fileRepository.findByStatus(com.securevault.enums.FileStatus.PENDING);

        return pendingFiles.stream().map(file -> {
            User owner = file.getOwner();
            return com.securevault.dto.PendingFileDTO.builder()
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

    public Resource loadDecryptedFileAsResource(Long fileId) throws Exception {
        FileDocument fileDocument = getFile(fileId);
        Path filePath = Paths.get(fileDocument.getEncryptedPath());

        // Decrypt to temp file
        // We need a unique temp file name
        String tempFileName = "decrypted_" + UUID.randomUUID().toString() + "_" + fileDocument.getFileName();
        Path tempPath = Paths.get(uploadDir).resolve(tempFileName);

        encryptionService.decryptFile(filePath, tempPath, fileDocument.getEncryptionIv());

        Resource resource = new UrlResource(tempPath.toUri());
        if (resource.exists() || resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("Could not read the file!");
        }
    }

    public void deleteFile(Long fileId) throws Exception {
        FileDocument fileDocument = getFile(fileId);

        // Delete physical encrypted file
        Path filePath = Paths.get(fileDocument.getEncryptedPath());
        if (Files.exists(filePath)) {
            Files.delete(filePath);
        }

        // Delete database record
        fileRepository.delete(fileDocument);
    }
}
