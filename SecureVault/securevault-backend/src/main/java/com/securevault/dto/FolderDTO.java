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
public class FolderDTO {
    private Long id;
    private String name;
    private Long parentId;
    private String parentName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int fileCount;
    private int subfolderCount;
}
