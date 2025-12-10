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
public class SharedFileDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private long size;
    private String status;
    private LocalDateTime uploadedAt;
    private LocalDateTime sharedAt;
    private String ownerUsername;
    private String ownerEmail;
}
