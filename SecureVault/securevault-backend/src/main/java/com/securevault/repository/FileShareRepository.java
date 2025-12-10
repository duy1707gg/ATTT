package com.securevault.repository;

import com.securevault.entity.FileShare;
import com.securevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileShareRepository extends JpaRepository<FileShare, Long> {
    List<FileShare> findBySharedWithUser(User user);

    boolean existsByFileIdAndSharedWithUserId(Long fileId, Long userId);
}
