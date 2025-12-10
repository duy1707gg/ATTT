package com.securevault.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class EncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12; // 12 bytes for GCM (recommended)
    private static final int GCM_TAG_LENGTH = 128; // 128 bits authentication tag

    @Value("${securevault.app.masterKey}")
    private String masterKeyStr;

    public void encryptFile(Path source, Path dest, String ivStr) throws Exception {
        SecretKey key = getKey();
        byte[] ivBytes = Base64.getDecoder().decode(ivStr);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, ivBytes);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec);

        try (InputStream fis = Files.newInputStream(source);
                OutputStream fos = Files.newOutputStream(dest);
                CipherOutputStream cos = new CipherOutputStream(fos, cipher)) {

            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                cos.write(buffer, 0, bytesRead);
            }
        }
    }

    public void decryptFile(Path source, Path dest, String ivStr) throws Exception {
        SecretKey key = getKey();
        byte[] ivBytes = Base64.getDecoder().decode(ivStr);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, ivBytes);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec);

        try (InputStream fis = Files.newInputStream(source);
                CipherInputStream cis = new CipherInputStream(fis, cipher);
                OutputStream fos = Files.newOutputStream(dest)) {

            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = cis.read(buffer)) != -1) {
                fos.write(buffer, 0, bytesRead);
            }
        }
    }

    public String generateIv() {
        byte[] iv = new byte[GCM_IV_LENGTH]; // 12 bytes for GCM
        new SecureRandom().nextBytes(iv);
        return Base64.getEncoder().encodeToString(iv);
    }

    private SecretKey getKey() {
        byte[] decodedKey = Base64.getDecoder().decode(masterKeyStr);
        return new SecretKeySpec(decodedKey, 0, decodedKey.length, "AES");
    }

    public String encryptString(String attribute) {
        try {
            SecretKey key = getKey();

            // Generate random IV for GCM
            byte[] ivBytes = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(ivBytes);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, ivBytes);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec);

            byte[] encrypted = cipher.doFinal(attribute.getBytes("UTF-8"));

            // Combine IV + Encrypted (GCM tag is appended automatically)
            byte[] combined = new byte[ivBytes.length + encrypted.length];
            System.arraycopy(ivBytes, 0, combined, 0, ivBytes.length);
            System.arraycopy(encrypted, 0, combined, ivBytes.length, encrypted.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decryptString(String dbData) {
        try {
            byte[] combined = Base64.getDecoder().decode(dbData);

            // Extract IV (12 bytes for GCM)
            byte[] ivBytes = new byte[GCM_IV_LENGTH];
            System.arraycopy(combined, 0, ivBytes, 0, GCM_IV_LENGTH);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, ivBytes);

            // Extract Encrypted data (includes GCM tag)
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);

            SecretKey key = getKey();
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec);

            return new String(cipher.doFinal(encrypted), "UTF-8");
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
