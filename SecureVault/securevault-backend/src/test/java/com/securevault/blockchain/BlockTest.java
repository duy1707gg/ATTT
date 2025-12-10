package com.securevault.blockchain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Block and blockchain validation.
 */
class BlockTest {

    private Block genesisBlock;
    private Block secondBlock;

    @BeforeEach
    void setUp() {
        genesisBlock = new Block(0, "Genesis Block", "0");
        secondBlock = new Block(1, "Second Block Data", genesisBlock.getHash());
    }

    @Test
    @DisplayName("Should create block with correct index and data")
    void createBlock_ShouldHaveCorrectProperties() {
        assertEquals(0, genesisBlock.getIndex());
        assertEquals("Genesis Block", genesisBlock.getData());
        assertEquals("0", genesisBlock.getPreviousHash());
        assertNotNull(genesisBlock.getHash());
        assertNotNull(genesisBlock.getTimestamp());
    }

    @Test
    @DisplayName("Should calculate consistent hash for same data")
    void calculateHash_SameData_ShouldBeConsistent() {
        String hash1 = genesisBlock.calculateHash();
        String hash2 = genesisBlock.calculateHash();

        assertEquals(hash1, hash2);
    }

    @Test
    @DisplayName("Should produce different hash for different data")
    void calculateHash_DifferentData_ShouldBeDifferent() {
        Block block1 = new Block(0, "Data 1", "0");
        Block block2 = new Block(0, "Data 2", "0");

        assertNotEquals(block1.getHash(), block2.getHash());
    }

    @Test
    @DisplayName("Should link blocks correctly via previousHash")
    void blockChaining_ShouldLinkCorrectly() {
        assertEquals(genesisBlock.getHash(), secondBlock.getPreviousHash());
    }

    @Test
    @DisplayName("Mining should produce hash with required leading zeros")
    void mineBlock_ShouldProduceValidHash() {
        Block block = new Block(1, "Test Data", "0");
        int difficulty = 2;

        block.mineBlock(difficulty);

        String prefix = block.getHash().substring(0, difficulty);
        assertEquals("00", prefix);
    }

    @Test
    @DisplayName("Hash should be 64 characters (SHA-256)")
    void hash_ShouldBe64Characters() {
        assertEquals(64, genesisBlock.getHash().length());
    }

    @Test
    @DisplayName("Modifying data should invalidate hash")
    void modifyData_ShouldInvalidateHash() {
        String originalHash = genesisBlock.getHash();

        // This simulates tampering - in real scenario data field is private
        // We test that recalculating hash would differ
        Block tamperedBlock = new Block(0, "Modified Genesis Block", "0");

        assertNotEquals(originalHash, tamperedBlock.getHash());
    }

    @Test
    @DisplayName("SHA-256 should produce consistent output")
    void applySha256_ShouldBeConsistent() {
        String input = "test input";

        String hash1 = Block.applySha256(input);
        String hash2 = Block.applySha256(input);

        assertEquals(hash1, hash2);
        assertEquals(64, hash1.length());
    }
}
