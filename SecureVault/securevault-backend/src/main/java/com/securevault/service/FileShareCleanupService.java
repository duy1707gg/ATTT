package com.securevault.service;

import com.securevault.repository.FileShareRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service tự động dọn dẹp các file share đã hết hạn.
 */
@Service
public class FileShareCleanupService {

    private static final Logger logger = LoggerFactory.getLogger(FileShareCleanupService.class);

    private final FileShareRepository fileShareRepository;

    public FileShareCleanupService(FileShareRepository fileShareRepository) {
        this.fileShareRepository = fileShareRepository;
    }

    /**
     * Chạy mỗi ngày lúc 2:00 AM để xóa các file share đã hết hạn.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupExpiredShares() {
        logger.info("Bắt đầu dọn dẹp các file share đã hết hạn...");

        LocalDateTime now = LocalDateTime.now();
        int deletedCount = fileShareRepository.findByExpiresAtBefore(now).size();

        if (deletedCount > 0) {
            fileShareRepository.deleteByExpiresAtBefore(now);
            logger.info("Đã xóa {} file share đã hết hạn.", deletedCount);
        } else {
            logger.info("Không có file share nào hết hạn cần xóa.");
        }
    }
}
