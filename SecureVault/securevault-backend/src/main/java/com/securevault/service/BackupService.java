package com.securevault.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;

@Service
public class BackupService {

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    // Run every day at midnight
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

        // Command for mysqldump
        // Note: This requires mysqldump to be in the system PATH
        String command = String.format("mysqldump -u%s -p%s securevault -r %s",
                dbUsername, dbPassword, backupPath);

        // If password is empty, don't use -p
        if (dbPassword == null || dbPassword.isEmpty()) {
            command = String.format("mysqldump -u%s securevault -r %s",
                    dbUsername, backupPath);
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(command.split(" "));
            pb.redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();
            if (exitCode == 0) {
                System.out.println("Database backup created successfully: " + backupPath);
            } else {
                System.err.println("Database backup failed. Exit code: " + exitCode);
            }
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }
}
