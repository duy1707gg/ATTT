package com.securevault.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for EncryptionService with AES-GCM encryption.
 */
class EncryptionServiceTest {

    private EncryptionService encryptionService;

    // Test master key (32 bytes base64 encoded)
    private static final String TEST_MASTER_KEY = "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=";

    @BeforeEach
    void setUp() {
        encryptionService = new EncryptionService();
        ReflectionTestUtils.setField(encryptionService, "masterKeyStr", TEST_MASTER_KEY);
    }

    @Test
    @DisplayName("Should generate 12-byte IV for GCM")
    void generateIv_ShouldReturn12ByteIv() {
        String iv = encryptionService.generateIv();

        assertNotNull(iv);
        // Base64 encoded 12 bytes = 16 characters
        assertEquals(16, iv.length());
    }

    @Test
    @DisplayName("Should encrypt and decrypt string correctly with AES-GCM")
    void encryptDecryptString_RoundTrip_ShouldMatchOriginal() {
        String originalText = "Hello, SecureVault!";

        String encrypted = encryptionService.encryptString(originalText);
        String decrypted = encryptionService.decryptString(encrypted);

        assertNotNull(encrypted);
        assertNotEquals(originalText, encrypted);
        assertEquals(originalText, decrypted);
    }

    @Test
    @DisplayName("Should encrypt same text differently each time (unique IV)")
    void encryptString_SameTextTwice_ShouldProduceDifferentCiphertext() {
        String originalText = "Same text to encrypt";

        String encrypted1 = encryptionService.encryptString(originalText);
        String encrypted2 = encryptionService.encryptString(originalText);

        assertNotEquals(encrypted1, encrypted2, "Same plaintext should produce different ciphertext due to random IV");
    }

    @Test
    @DisplayName("Should fail decryption with tampered ciphertext (GCM authentication)")
    void decryptString_TamperedCiphertext_ShouldThrowException() {
        String originalText = "Sensitive data";
        String encrypted = encryptionService.encryptString(originalText);

        // Tamper with the ciphertext (flip a bit in the middle)
        char[] chars = encrypted.toCharArray();
        int midPoint = chars.length / 2;
        chars[midPoint] = (chars[midPoint] == 'A') ? 'B' : 'A';
        String tampered = new String(chars);

        // GCM should detect tampering and throw an exception
        assertThrows(RuntimeException.class, () -> {
            encryptionService.decryptString(tampered);
        });
    }

    @Test
    @DisplayName("Should handle empty string encryption")
    void encryptDecryptString_EmptyString_ShouldWork() {
        String originalText = "";

        String encrypted = encryptionService.encryptString(originalText);
        String decrypted = encryptionService.decryptString(encrypted);

        assertEquals(originalText, decrypted);
    }

    @Test
    @DisplayName("Should handle special characters and unicode")
    void encryptDecryptString_SpecialCharacters_ShouldWork() {
        String originalText = "Xin chào! 你好! مرحبا! 🔐🛡️";

        String encrypted = encryptionService.encryptString(originalText);
        String decrypted = encryptionService.decryptString(encrypted);

        assertEquals(originalText, decrypted);
    }

    @Test
    @DisplayName("Should handle long text encryption")
    void encryptDecryptString_LongText_ShouldWork() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 1000; i++) {
            sb.append("This is a test sentence number ").append(i).append(". ");
        }
        String originalText = sb.toString();

        String encrypted = encryptionService.encryptString(originalText);
        String decrypted = encryptionService.decryptString(encrypted);

        assertEquals(originalText, decrypted);
    }
}
