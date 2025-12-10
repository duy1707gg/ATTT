package com.securevault.repository;

import com.securevault.entity.FileDocument;
import com.securevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<FileDocument, Long> {
    List<FileDocument> findByOwner(User owner);

    List<FileDocument> findBySharedWithContaining(User user);

    List<FileDocument> findByStatus(com.securevault.enums.FileStatus status);
}
