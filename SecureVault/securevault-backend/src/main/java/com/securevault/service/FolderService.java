package com.securevault.service;

import com.securevault.dto.FolderDTO;
import com.securevault.dto.SharedFolderDTO;
import com.securevault.entity.FileDocument;
import com.securevault.entity.Folder;
import com.securevault.entity.FolderShare;
import com.securevault.entity.User;
import com.securevault.repository.FileRepository;
import com.securevault.repository.FolderRepository;
import com.securevault.repository.FolderShareRepository;
import com.securevault.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service quản lý thư mục.
 */
@Service
@Transactional
public class FolderService {

    private final FolderRepository folderRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FolderShareRepository folderShareRepository;
    private final EmailService emailService;

    public FolderService(FolderRepository folderRepository, FileRepository fileRepository,
            UserRepository userRepository, FolderShareRepository folderShareRepository,
            EmailService emailService) {
        this.folderRepository = folderRepository;
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.folderShareRepository = folderShareRepository;
        this.emailService = emailService;
    }

    /**
     * Tạo thư mục mới.
     */
    public FolderDTO createFolder(String name, Long parentId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Folder parent = null;
        if (parentId != null) {
            parent = folderRepository.findByIdAndOwner(parentId, user)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục cha"));
        }

        // Kiểm tra tên trùng
        if (folderRepository.existsByNameAndOwnerAndParent(name, user, parent)) {
            throw new RuntimeException("Thư mục với tên này đã tồn tại");
        }

        Folder folder = Folder.builder()
                .name(name)
                .owner(user)
                .parent(parent)
                .build();

        Folder saved = folderRepository.save(folder);
        return toDTO(saved);
    }

    /**
     * Lấy danh sách thư mục.
     */
    public List<FolderDTO> getFolders(Long parentId, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        List<Folder> folders;
        if (parentId == null) {
            folders = folderRepository.findByOwnerAndParentIsNull(user);
        } else {
            Folder parent = folderRepository.findByIdAndOwner(parentId, user)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));
            folders = folderRepository.findByOwnerAndParent(user, parent);
        }

        return folders.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Lấy thông tin thư mục.
     */
    public FolderDTO getFolder(Long folderId, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));
        return toDTO(folder);
    }

    /**
     * Đổi tên thư mục.
     */
    public FolderDTO renameFolder(Long folderId, String newName, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));

        // Kiểm tra tên trùng
        if (folderRepository.existsByNameAndOwnerAndParent(newName, user, folder.getParent())) {
            throw new RuntimeException("Thư mục với tên này đã tồn tại");
        }

        folder.setName(newName);
        Folder saved = folderRepository.save(folder);
        return toDTO(saved);
    }

    /**
     * Xóa thư mục (cascade xóa files và subfolders).
     */
    public void deleteFolder(Long folderId, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));

        folderRepository.delete(folder);
    }

    /**
     * Di chuyển file vào thư mục.
     */
    public void moveFileToFolder(Long fileId, Long folderId, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        FileDocument file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file"));

        // Kiểm tra quyền sở hữu file
        if (!file.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền di chuyển file này");
        }

        Folder folder = null;
        if (folderId != null) {
            folder = folderRepository.findByIdAndOwner(folderId, user)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));
        }

        file.setFolder(folder);
        fileRepository.save(file);
    }

    /**
     * Lấy danh sách files trong thư mục.
     */
    public List<FileDocument> getFilesInFolder(Long folderId, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();

        if (folderId == null) {
            return fileRepository.findByOwnerAndFolderIsNull(user);
        } else {
            Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));
            return fileRepository.findByOwnerAndFolder(user, folder);
        }
    }

    /**
     * Lấy breadcrumb path cho thư mục.
     */
    public List<FolderDTO> getBreadcrumb(Long folderId, Long userId) {
        if (folderId == null) {
            return List.of();
        }

        User user = userRepository.findById(userId).orElseThrow();
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));

        List<FolderDTO> breadcrumb = new java.util.ArrayList<>();
        Folder current = folder;
        while (current != null) {
            breadcrumb.add(0, toDTO(current));
            current = current.getParent();
        }
        return breadcrumb;
    }

    /**
     * Chia sẻ thư mục với nhiều người dùng qua email.
     */
    public void shareFolderWithMultipleUsers(Long folderId, List<String> emails, Long ownerId) {
        User owner = userRepository.findById(ownerId).orElseThrow();
        Folder folder = folderRepository.findByIdAndOwner(folderId, owner)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));

        LocalDateTime expiresAt = LocalDateTime.now().plusMonths(3);

        for (String email : emails) {
            User sharedUser = userRepository.findByEmail(email).orElse(null);
            if (sharedUser == null || sharedUser.getId().equals(ownerId)) {
                continue;
            }

            // Kiểm tra đã chia sẻ chưa
            if (!folderShareRepository.existsByFolderAndSharedWithUser(folder, sharedUser)) {
                FolderShare share = FolderShare.builder()
                        .folder(folder)
                        .sharedWithUser(sharedUser)
                        .expiresAt(expiresAt)
                        .build();
                folderShareRepository.save(share);

                // Gửi email thông báo
                try {
                    emailService.sendFolderSharedNotification(
                            sharedUser.getEmail(),
                            sharedUser.getUsername(),
                            folder.getName(),
                            owner.getUsername());
                } catch (Exception e) {
                    // Log error but continue
                }
            }
        }
    }

    /**
     * Lấy danh sách thư mục được chia sẻ với user.
     */
    public List<SharedFolderDTO> getSharedFolders(Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        LocalDateTime now = LocalDateTime.now();

        return folderShareRepository.findBySharedWithUserAndExpiresAtAfter(user, now)
                .stream()
                .map(share -> SharedFolderDTO.builder()
                        .id(share.getFolder().getId())
                        .folderName(share.getFolder().getName())
                        .ownerId(share.getFolder().getOwner().getId())
                        .ownerUsername(share.getFolder().getOwner().getUsername())
                        .sharedAt(share.getSharedAt())
                        .expiresAt(share.getExpiresAt())
                        .fileCount(fileRepository.findByFolder(share.getFolder()).size())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Lấy files trong thư mục được chia sẻ.
     */
    public List<FileDocument> getFilesInSharedFolder(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));

        // Kiểm tra quyền truy cập (đã được chia sẻ và chưa hết hạn)
        boolean hasAccess = folderShareRepository.existsByFolderIdAndSharedWithUserIdAndExpiresAtAfter(
                folderId, userId, LocalDateTime.now());
        if (!hasAccess) {
            throw new RuntimeException("Bạn không có quyền truy cập thư mục này hoặc quyền truy cập đã hết hạn");
        }

        // Sử dụng fileRepository để tránh lazy loading exception
        return fileRepository.findByFolder(folder);
    }

    /**
     * Lấy danh sách files trong thư mục (cho owner) - dùng cho download ZIP.
     */
    public List<FileDocument> getFilesInOwnedFolder(Long folderId, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Folder folder = folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục hoặc bạn không có quyền"));
        return fileRepository.findByFolder(folder);
    }

    /**
     * Lấy thông tin thư mục theo ID (cho owner) - dùng cho download ZIP.
     */
    public Folder getFolderEntity(Long folderId, Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return folderRepository.findByIdAndOwner(folderId, user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục hoặc bạn không có quyền"));
    }

    /**
     * Lấy thông tin shared folder entity (dùng cho download ZIP).
     */
    public Folder getSharedFolderEntity(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thư mục"));

        boolean hasAccess = folderShareRepository.existsByFolderIdAndSharedWithUserIdAndExpiresAtAfter(
                folderId, userId, LocalDateTime.now());
        if (!hasAccess) {
            throw new RuntimeException("Bạn không có quyền truy cập thư mục này hoặc quyền truy cập đã hết hạn");
        }
        return folder;
    }

    private FolderDTO toDTO(Folder folder) {
        return FolderDTO.builder()
                .id(folder.getId())
                .name(folder.getName())
                .parentId(folder.getParent() != null ? folder.getParent().getId() : null)
                .parentName(folder.getParent() != null ? folder.getParent().getName() : null)
                .createdAt(folder.getCreatedAt())
                .updatedAt(folder.getUpdatedAt())
                .fileCount(fileRepository.findByFolder(folder).size())
                .subfolderCount(folderRepository.countByParent(folder))
                .build();
    }
}
