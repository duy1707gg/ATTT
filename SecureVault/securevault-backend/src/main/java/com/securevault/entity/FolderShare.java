package com.securevault.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "folder_share_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderShare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", nullable = false)
    private Folder folder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User sharedWithUser;

    @CreationTimestamp
    private LocalDateTime sharedAt;

    // Ngày hết hạn chia sẻ (mặc định 3 tháng từ ngày chia sẻ)
    private LocalDateTime expiresAt;
}
