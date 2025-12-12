package com.securevault.repository;

import com.securevault.entity.FileDocument;
import com.securevault.entity.Folder;
import com.securevault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<FileDocument, Long> {
    List<FileDocument> findByOwner(User owner);

    List<FileDocument> findBySharedWithContaining(User user);

    List<FileDocument> findByStatus(com.securevault.enums.FileStatus status);

    // Folder-related queries
    List<FileDocument> findByOwnerAndFolder(User owner, Folder folder);

    List<FileDocument> findByOwnerAndFolderIsNull(User owner);

    // Find all files in a folder (for shared folder access)
    List<FileDocument> findByFolder(Folder folder);
}
