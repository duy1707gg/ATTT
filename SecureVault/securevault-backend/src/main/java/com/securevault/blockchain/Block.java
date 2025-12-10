package com.securevault.blockchain;

import lombok.Data;

import java.security.MessageDigest;
import java.time.LocalDateTime;

@Data
public class Block {
    private int index;
    private LocalDateTime timestamp;
    private String timestampStr; // Exact string used for hash calculation
    private String data; // The audit log message
    private String previousHash;
    private String hash;
    private int nonce;

    public Block(int index, String data, String previousHash) {
        this.index = index;
        this.timestamp = LocalDateTime.now();
        this.timestampStr = this.timestamp.toString(); // Store exact string
        this.data = data;
        this.previousHash = previousHash;
        this.hash = calculateHash();
    }

    public String calculateHash() {
        // Use timestampStr for consistent hash calculation
        String input = index + timestampStr + data + previousHash + nonce;
        return applySha256(input);
    }

    public void mineBlock(int difficulty) {
        String target = new String(new char[difficulty]).replace('\0', '0');
        while (!hash.substring(0, difficulty).equals(target)) {
            nonce++;
            hash = calculateHash();
        }
    }

    // Setters for loading from database
    public void setHash(String hash) {
        this.hash = hash;
    }

    public void setNonce(int nonce) {
        this.nonce = nonce;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public void setTimestampStr(String timestampStr) {
        this.timestampStr = timestampStr;
    }

    public static String applySha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes("UTF-8"));
            StringBuffer hexString = new StringBuffer();
            for (int i = 0; i < hash.length; i++) {
                String hex = Integer.toHexString(0xff & hash[i]);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
