package com.securevault.repository;

import com.securevault.entity.Folder;
import com.securevault.entity.FolderShare;
import com.securevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FolderShareRepository extends JpaRepository<FolderShare, Long> {

    List<FolderShare> findBySharedWithUser(User user);

    List<FolderShare> findBySharedWithUserAndExpiresAtAfter(User user, LocalDateTime now);

    List<FolderShare> findByFolder(Folder folder);

    Optional<FolderShare> findByFolderAndSharedWithUser(Folder folder, User user);

    boolean existsByFolderAndSharedWithUser(Folder folder, User user);

    List<FolderShare> findByExpiresAtBefore(LocalDateTime now);

    void deleteByExpiresAtBefore(LocalDateTime now);

    boolean existsByFolderIdAndSharedWithUserIdAndExpiresAtAfter(Long folderId, Long userId, LocalDateTime now);
}
