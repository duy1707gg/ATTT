package com.securevault.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service gửi email.
 */
@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Gửi email chứa mã OTP.
     *
     * @param to      Địa chỉ email người nhận
     * @param subject Tiêu đề email
     * @param message Nội dung email
     */
    public void sendOtpMessage(String to, String subject, String message) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setText(message, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("noreply@securevault.com");
            mailSender.send(mimeMessage);
            logger.info("Email đã được gửi thành công đến: {}", to);
        } catch (MessagingException e) {
            logger.error("Lỗi gửi email đến {}: {}", to, e.getMessage());
            throw new RuntimeException("Không thể gửi email: " + e.getMessage());
        }
    }

    /**
     * Gửi email thông báo cho Manager khi có file chờ duyệt.
     *
     * @param to           Địa chỉ email Manager
     * @param fileName     Tên file chờ duyệt
     * @param uploaderName Tên người tải lên
     */
    public void sendFilePendingNotification(String to, String fileName, String uploaderName) {
        String subject = "SecureVault - File mới chờ duyệt";
        String message = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">📁 Thông báo file chờ duyệt</h2>
                    <p>Xin chào,</p>
                    <p>Có một file mới cần được duyệt trong hệ thống SecureVault:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Tên file:</strong> %s</p>
                        <p><strong>Người tải lên:</strong> %s</p>
                        <p><strong>Trạng thái:</strong> <span style="color: #f59e0b;">Chờ duyệt</span></p>
                    </div>
                    <p>Vui lòng đăng nhập vào hệ thống để xem xét và duyệt file này.</p>
                    <br/>
                    <p>Trân trọng,<br/>SecureVault System</p>
                </body>
                </html>
                """, fileName, uploaderName);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setText(message, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("noreply@securevault.com");
            mailSender.send(mimeMessage);
            logger.info("Email thông báo file chờ duyệt đã được gửi đến: {}", to);
        } catch (MessagingException e) {
            logger.error("Lỗi gửi email thông báo file chờ duyệt đến {}: {}", to, e.getMessage());
        }
    }

    /**
     * Gửi email thông báo khi file được chia sẻ với người dùng.
     *
     * @param to         Địa chỉ email người nhận
     * @param fileName   Tên file được chia sẻ
     * @param sharerName Tên người chia sẻ
     */
    public void sendFileSharedNotification(String to, String fileName, String sharerName) {
        String subject = "SecureVault - Bạn vừa được chia sẻ một file";
        String message = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #10b981;">🔗 Thông báo chia sẻ file</h2>
                    <p>Xin chào,</p>
                    <p>Một file vừa được chia sẻ với bạn trong hệ thống SecureVault:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Tên file:</strong> %s</p>
                        <p><strong>Người chia sẻ:</strong> %s</p>
                    </div>
                    <p>Vui lòng đăng nhập vào hệ thống để xem và tải file này.</p>
                    <br/>
                    <p>Trân trọng,<br/>SecureVault System</p>
                </body>
                </html>
                """, fileName, sharerName);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setText(message, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("noreply@securevault.com");
            mailSender.send(mimeMessage);
            logger.info("Email thông báo chia sẻ file đã được gửi đến: {}", to);
        } catch (MessagingException e) {
            logger.error("Lỗi gửi email thông báo chia sẻ file đến {}: {}", to, e.getMessage());
        }
    }

    /**
     * Gửi email thông báo khi thư mục được chia sẻ.
     */
    public void sendFolderSharedNotification(String to, String recipientName, String folderName, String sharerName) {
        String subject = "📁 Một thư mục đã được chia sẻ với bạn - SecureVault";
        String message = String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #6366f1;">📁 Thông báo chia sẻ thư mục</h2>
                    <p>Xin chào %s,</p>
                    <p>Một thư mục vừa được chia sẻ với bạn trong hệ thống SecureVault:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <p><strong>Tên thư mục:</strong> %s</p>
                        <p><strong>Người chia sẻ:</strong> %s</p>
                    </div>
                    <p>Vui lòng đăng nhập vào hệ thống để xem và truy cập thư mục này.</p>
                    <br/>
                    <p>Trân trọng,<br/>SecureVault System</p>
                </body>
                </html>
                """, recipientName, folderName, sharerName);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");
            helper.setText(message, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("noreply@securevault.com");
            mailSender.send(mimeMessage);
            logger.info("Email thông báo chia sẻ thư mục đã được gửi đến: {}", to);
        } catch (MessagingException e) {
            logger.error("Lỗi gửi email thông báo chia sẻ thư mục đến {}: {}", to, e.getMessage());
        }
    }
}
