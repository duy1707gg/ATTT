package com.securevault.blockchain;

import com.securevault.entity.BlockEntity;
import com.securevault.repository.BlockRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Blockchain service with database persistence.
 * Loads chain from database on startup and saves new blocks automatically.
 */
@Service
public class Blockchain {
    private static final Logger logger = LoggerFactory.getLogger(Blockchain.class);

    private List<Block> chain;
    private int difficulty = 2; // Low difficulty for demo

    @Autowired
    private BlockRepository blockRepository;

    public Blockchain() {
        chain = new ArrayList<>();
    }

    @PostConstruct
    public void init() {
        loadChainFromDatabase();
    }

    /**
     * Load blockchain from database on startup
     */
    private void loadChainFromDatabase() {
        List<BlockEntity> savedBlocks = blockRepository.findAllByOrderByBlockIndexAsc();

        if (savedBlocks.isEmpty()) {
            // Create genesis block if database is empty
            Block genesisBlock = new Block(0, "Genesis Block", "0");
            chain.add(genesisBlock);
            saveBlockToDatabase(genesisBlock);
            logger.info("Created genesis block");
        } else {
            // Reconstruct chain from database
            for (BlockEntity entity : savedBlocks) {
                Block block = new Block(entity.getBlockIndex(), entity.getData(), entity.getPreviousHash());
                block.setTimestamp(entity.getTimestamp());
                // Use saved timestamp string for hash calculation consistency
                block.setTimestampStr(entity.getTimestampStr());
                block.setNonce(entity.getNonce());
                block.setHash(entity.getHash());
                chain.add(block);
            }
            logger.info("Loaded {} blocks from database", chain.size());
        }
    }

    /**
     * Reload chain from database (used after restoration)
     */
    public void reloadChain() {
        chain.clear();
        loadChainFromDatabase();
    }

    /**
     * Save a block to the database
     */
    private void saveBlockToDatabase(Block block) {
        BlockEntity entity = BlockEntity.builder()
                .blockIndex(block.getIndex())
                .timestamp(block.getTimestamp())
                .timestampStr(block.getTimestampStr()) // Save exact timestamp string
                .data(block.getData())
                .previousHash(block.getPreviousHash())
                .hash(block.getHash())
                .nonce(block.getNonce())
                .build();
        blockRepository.save(entity);
    }

    public Block getLatestBlock() {
        return chain.get(chain.size() - 1);
    }

    public void addBlock(String data) {
        Block latestBlock = getLatestBlock();
        Block newBlock = new Block(latestBlock.getIndex() + 1, data, latestBlock.getHash());
        newBlock.mineBlock(difficulty);
        chain.add(newBlock);

        // Persist to database
        saveBlockToDatabase(newBlock);
        logger.info("Added new block {} with hash {}", newBlock.getIndex(), newBlock.getHash().substring(0, 8));
    }

    /**
     * Validate blockchain integrity by reading FRESH data from database
     * and recalculating hashes to detect any tampering.
     */
    public boolean isChainValid() {
        List<BlockEntity> savedBlocks = blockRepository.findAllByOrderByBlockIndexAsc();

        if (savedBlocks.isEmpty()) {
            return true;
        }

        for (int i = 0; i < savedBlocks.size(); i++) {
            BlockEntity current = savedBlocks.get(i);

            // Use saved timestamp string for consistent hash calculation
            String timestampStr = current.getTimestampStr() != null
                    ? current.getTimestampStr()
                    : current.getTimestamp().toString();

            String input = current.getBlockIndex() + timestampStr +
                    current.getData() + current.getPreviousHash() + current.getNonce();
            String recalculatedHash = Block.applySha256(input);

            if (!current.getHash().equals(recalculatedHash)) {
                logger.error("DATABASE TAMPERING DETECTED at block {}!", current.getBlockIndex());
                return false;
            }

            if (i > 0) {
                BlockEntity previous = savedBlocks.get(i - 1);
                if (!current.getPreviousHash().equals(previous.getHash())) {
                    logger.error("Chain linkage broken at block {}", current.getBlockIndex());
                    return false;
                }
            }
        }

        logger.info("Blockchain validation passed - {} blocks verified", savedBlocks.size());
        return true;
    }

    /**
     * Get detailed validation result with information about tampered blocks
     */
    public Map<String, Object> validateWithDetails() {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> tamperedBlocks = new ArrayList<>();

        List<BlockEntity> savedBlocks = blockRepository.findAllByOrderByBlockIndexAsc();

        if (savedBlocks.isEmpty()) {
            result.put("valid", true);
            result.put("message", "Blockchain is VALID");
            result.put("totalBlocks", 0);
            return result;
        }

        boolean isValid = true;

        for (int i = 0; i < savedBlocks.size(); i++) {
            BlockEntity current = savedBlocks.get(i);

            // Use saved timestamp string for consistent hash calculation
            String timestampStr = current.getTimestampStr() != null
                    ? current.getTimestampStr()
                    : current.getTimestamp().toString();

            String input = current.getBlockIndex() + timestampStr +
                    current.getData() + current.getPreviousHash() + current.getNonce();
            String recalculatedHash = Block.applySha256(input);

            // Check for data tampering (hash mismatch)
            if (!current.getHash().equals(recalculatedHash)) {
                isValid = false;
                Map<String, Object> tamperedInfo = new HashMap<>();
                tamperedInfo.put("blockIndex", current.getBlockIndex());
                tamperedInfo.put("currentData", current.getData());
                tamperedInfo.put("storedHash", current.getHash());
                tamperedInfo.put("recalculatedHash", recalculatedHash);
                tamperedInfo.put("timestamp", current.getTimestamp().toString());
                tamperedInfo.put("type", "DATA_MODIFIED");
                tamperedInfo.put("description", "Dữ liệu block đã bị sửa đổi. Hash không khớp.");
                tamperedBlocks.add(tamperedInfo);

                logger.error("TAMPERING: Block {} data was modified", current.getBlockIndex());
            }

            // Check for chain linkage issues
            if (i > 0) {
                BlockEntity previous = savedBlocks.get(i - 1);
                if (!current.getPreviousHash().equals(previous.getHash())) {
                    isValid = false;
                    Map<String, Object> tamperedInfo = new HashMap<>();
                    tamperedInfo.put("blockIndex", current.getBlockIndex());
                    tamperedInfo.put("currentData", current.getData());
                    tamperedInfo.put("expectedPreviousHash", previous.getHash());
                    tamperedInfo.put("actualPreviousHash", current.getPreviousHash());
                    tamperedInfo.put("type", "CHAIN_BROKEN");
                    tamperedInfo.put("description", "Liên kết chuỗi bị phá vỡ. Previous hash không khớp.");
                    tamperedBlocks.add(tamperedInfo);

                    logger.error("TAMPERING: Block {} chain linkage broken", current.getBlockIndex());
                }
            }
        }

        result.put("valid", isValid);
        result.put("message", isValid ? "Blockchain is VALID" : "Blockchain is INVALID (Tampered)");
        result.put("totalBlocks", savedBlocks.size());
        result.put("tamperedBlocks", tamperedBlocks);
        result.put("tamperedCount", tamperedBlocks.size());

        return result;
    }

    /**
     * Delete a tampered block and all blocks after it
     * This is a destructive operation - use with caution
     */
    public Map<String, Object> deleteTamperedBlock(int blockIndex) {
        Map<String, Object> result = new HashMap<>();

        if (blockIndex <= 0) {
            result.put("success", false);
            result.put("message", "Không thể xóa Genesis Block (block #0)");
            return result;
        }

        List<BlockEntity> savedBlocks = blockRepository.findAllByOrderByBlockIndexAsc();
        List<BlockEntity> blocksToDelete = new ArrayList<>();

        // Find all blocks from the tampered one onwards
        for (BlockEntity block : savedBlocks) {
            if (block.getBlockIndex() >= blockIndex) {
                blocksToDelete.add(block);
            }
        }

        if (blocksToDelete.isEmpty()) {
            result.put("success", false);
            result.put("message", "Không tìm thấy block #" + blockIndex);
            return result;
        }

        // Delete the blocks
        blockRepository.deleteAll(blocksToDelete);

        // Reload chain
        reloadChain();

        result.put("success", true);
        result.put("message", "Đã xóa " + blocksToDelete.size() + " block(s) từ block #" + blockIndex);
        result.put("deletedCount", blocksToDelete.size());
        result.put("remainingBlocks", chain.size());

        logger.warn("RECOVERY: Deleted {} blocks starting from block #{}", blocksToDelete.size(), blockIndex);

        return result;
    }

    /**
     * Rebuild the entire blockchain - use when all blocks are corrupted
     * This will delete ALL blocks and create a fresh genesis block
     */
    public Map<String, Object> rebuildBlockchain() {
        Map<String, Object> result = new HashMap<>();

        int deletedCount = (int) blockRepository.count();
        blockRepository.deleteAll();
        chain.clear();

        // Create new genesis block
        Block genesisBlock = new Block(0, "Genesis Block", "0");
        chain.add(genesisBlock);
        saveBlockToDatabase(genesisBlock);

        result.put("success", true);
        result.put("message", "Đã xây dựng lại Blockchain. Xóa " + deletedCount + " block cũ.");
        result.put("deletedCount", deletedCount);

        logger.warn("REBUILD: Blockchain rebuilt, deleted {} blocks", deletedCount);

        return result;
    }

    public List<Block> getChain() {
        return chain;
    }

    public int getChainSize() {
        return chain.size();
    }
}
