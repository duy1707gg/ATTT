package com.securevault.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.stream.Stream;

/**
 * Service for cleaning up temporary decrypted files.
 * Runs periodically to remove old temp files.
 */
@Service
public class TempFileCleanupService {
    private static final Logger logger = LoggerFactory.getLogger(TempFileCleanupService.class);

    @Value("${securevault.app.uploadDir}")
    private String uploadDir;

    // Max age for temp files in minutes (default: 5 minutes)
    private static final int TEMP_FILE_MAX_AGE_MINUTES = 5;

    /**
     * Cleanup temp files every 2 minutes
     */
    @Scheduled(fixedRate = 120000) // 2 minutes
    public void cleanupTempFiles() {
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            return;
        }

        try (Stream<Path> files = Files.list(uploadPath)) {
            Instant cutoffTime = Instant.now().minus(TEMP_FILE_MAX_AGE_MINUTES, ChronoUnit.MINUTES);

            files.filter(file -> file.getFileName().toString().startsWith("decrypted_"))
                    .filter(file -> {
                        try {
                            return Files.getLastModifiedTime(file).toInstant().isBefore(cutoffTime);
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .forEach(file -> {
                        try {
                            Files.delete(file);
                            logger.info("Deleted temp file: {}", file.getFileName());
                        } catch (IOException e) {
                            logger.error("Failed to delete temp file: {}", file.getFileName(), e);
                        }
                    });
        } catch (IOException e) {
            logger.error("Error during temp file cleanup", e);
        }
    }

    /**
     * Manual cleanup method for specific file
     */
    public void deleteTempFile(Path file) {
        try {
            if (Files.exists(file) && file.getFileName().toString().startsWith("decrypted_")) {
                Files.delete(file);
                logger.debug("Deleted temp file: {}", file.getFileName());
            }
        } catch (IOException e) {
            logger.error("Failed to delete temp file: {}", file.getFileName(), e);
        }
    }
}
