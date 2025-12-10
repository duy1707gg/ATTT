package com.securevault.service;

import com.securevault.blockchain.Blockchain;
import com.securevault.entity.RefreshToken;
import com.securevault.entity.User;
import com.securevault.payload.response.TokenRefreshResponse;
import com.securevault.repository.RefreshTokenRepository;
import com.securevault.repository.UserRepository;
import com.securevault.security.jwt.JwtUtils;
import com.securevault.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service quản lý refresh token.
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final Blockchain blockchain;

    @Value("${securevault.app.jwtRefreshExpirationMs:604800000}")
    private Long refreshTokenDurationMs;

    @Value("${securevault.app.jwtExpirationMs}")
    private Long jwtExpirationMs;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            JwtUtils jwtUtils,
            Blockchain blockchain) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.blockchain = blockchain;
    }

    /**
     * Tìm refresh token theo giá trị token.
     */
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    /**
     * Tạo refresh token mới cho người dùng.
     */
    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Xóa token cũ
        refreshTokenRepository.deleteByUser(user);
        refreshTokenRepository.flush();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Làm mới access token bằng refresh token.
     */
    @Transactional
    public TokenRefreshResponse refreshAccessToken(String requestRefreshToken) {
        RefreshToken refreshToken = findByToken(requestRefreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh token không tồn tại!"));

        verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
                userDetails.getAuthorities());

        String newAccessToken = jwtUtils.generateJwtToken(authentication);
        RefreshToken newRefreshToken = createRefreshToken(user.getId());

        blockchain.addBlock("Người dùng " + user.getUsername() + " đã làm mới access token");

        return new TokenRefreshResponse(newAccessToken, newRefreshToken.getToken(), jwtExpirationMs);
    }

    /**
     * Xác minh refresh token chưa hết hạn.
     */
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.");
        }
        return token;
    }

    /**
     * Xóa refresh token của người dùng (logout).
     */
    @Transactional
    public int deleteByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return refreshTokenRepository.deleteByUser(user);
    }
}
