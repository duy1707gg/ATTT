package com.securevault.repository;

import com.securevault.entity.FileShare;
import com.securevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FileShareRepository extends JpaRepository<FileShare, Long> {
    List<FileShare> findBySharedWithUser(User user);

    boolean existsByFileIdAndSharedWithUserId(Long fileId, Long userId);

    // Tìm các share chưa hết hạn
    List<FileShare> findBySharedWithUserAndExpiresAtAfter(User user, LocalDateTime now);

    // Tìm các share đã hết hạn để xóa
    List<FileShare> findByExpiresAtBefore(LocalDateTime now);

    // Xóa các share đã hết hạn
    void deleteByExpiresAtBefore(LocalDateTime now);
}
