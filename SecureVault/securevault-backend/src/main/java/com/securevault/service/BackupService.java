package com.securevault.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Service sao lưu database tự động.
 */
@Service
public class BackupService {

    private static final Logger logger = LoggerFactory.getLogger(BackupService.class);

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    /**
     * Sao lưu database mỗi ngày lúc 00:00.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    public void backupDatabase() {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss");
        String timestamp = dateFormat.format(new Date());
        String backupFileName = "backup_" + timestamp + ".sql";
        String backupPath = "backups/" + backupFileName;

        File backupDir = new File("backups");
        if (!backupDir.exists()) {
            backupDir.mkdirs();
        }

        String command = buildMysqldumpCommand(backupPath);

        try {
            ProcessBuilder pb = new ProcessBuilder(command.split(" "));
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                logger.info("Sao lưu database thành công: {}", backupPath);
            } else {
                logger.error("Sao lưu database thất bại. Exit code: {}", exitCode);
            }
        } catch (IOException | InterruptedException e) {
            logger.error("Lỗi sao lưu database: {}", e.getMessage());
        }
    }

    private String buildMysqldumpCommand(String backupPath) {
        if (dbPassword == null || dbPassword.isEmpty()) {
            return String.format("mysqldump -u%s securevault -r %s", dbUsername, backupPath);
        }
        return String.format("mysqldump -u%s -p%s securevault -r %s", dbUsername, dbPassword, backupPath);
    }
}
