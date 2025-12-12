package com.securevault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedFolderDTO {
    private Long id;
    private String folderName;
    private Long ownerId;
    private String ownerUsername;
    private LocalDateTime sharedAt;
    private LocalDateTime expiresAt;
    private int fileCount;
}
