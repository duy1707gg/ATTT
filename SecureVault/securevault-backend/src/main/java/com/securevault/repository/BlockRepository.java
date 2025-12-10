package com.securevault.repository;

import com.securevault.entity.BlockEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for blockchain blocks persistence.
 */
@Repository
public interface BlockRepository extends JpaRepository<BlockEntity, Long> {

    /**
     * Find all blocks ordered by their index (ascending)
     */
    List<BlockEntity> findAllByOrderByBlockIndexAsc();

    /**
     * Find the latest block (highest index)
     */
    Optional<BlockEntity> findTopByOrderByBlockIndexDesc();

    /**
     * Check if a block with a specific hash already exists
     */
    boolean existsByHash(String hash);
}
