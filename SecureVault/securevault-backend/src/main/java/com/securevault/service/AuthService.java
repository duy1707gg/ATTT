package com.securevault.service;

import com.securevault.blockchain.Blockchain;
import com.securevault.entity.RefreshToken;
import com.securevault.entity.User;
import com.securevault.enums.Role;
import com.securevault.payload.request.SignupRequest;
import com.securevault.payload.response.JwtResponse;
import com.securevault.repository.UserRepository;
import com.securevault.security.jwt.JwtUtils;
import com.securevault.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * Service xử lý logic xác thực người dùng.
 * Bao gồm: đăng nhập 2FA, OTP, đăng ký, reset password.
 */
@Service
@Transactional
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
    private final RefreshTokenService refreshTokenService;
    private final Blockchain blockchain;

    @Value("${securevault.app.jwtExpirationMs}")
    private Long jwtExpirationMs;

    public AuthService(AuthenticationManager authenticationManager,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils,
            EmailService emailService,
            RefreshTokenService refreshTokenService,
            Blockchain blockchain) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.emailService = emailService;
        this.refreshTokenService = refreshTokenService;
        this.blockchain = blockchain;
    }

    /**
     * Bước 1 của đăng nhập 2FA: xác thực credentials và gửi OTP qua email.
     *
     * @param username Tên đăng nhập
     * @param password Mật khẩu
     * @return User đã được gửi OTP
     */
    public User initiateLogin(String username, String password) {
        // Xác thực credentials
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        // Tạo và lưu OTP
        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Gửi OTP qua email
        emailService.sendOtpMessage(user.getEmail(), "SecureVault - Mã OTP Đăng Nhập",
                "Mã OTP của bạn là: " + otp + ". Mã có hiệu lực trong 5 phút.");

        return user;
    }

    /**
     * Bước 2 của đăng nhập 2FA: xác thực OTP và tạo JWT token.
     *
     * @param username Tên đăng nhập
     * @param otp      Mã OTP
     * @return JwtResponse chứa access token và refresh token
     */
    public JwtResponse verifyOtpAndGenerateToken(String username, String otp) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        validateOtp(user, otp);

        // Xóa OTP sau khi xác thực thành công
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        // Tạo JWT token
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
                userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = jwtUtils.generateJwtToken(authentication);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        // Ghi log vào blockchain
        blockchain.addBlock("Người dùng " + user.getUsername() + " đăng nhập thành công qua 2FA");

        return new JwtResponse(
                jwt,
                refreshToken.getToken(),
                jwtExpirationMs,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles);
    }

    /**
     * Gửi lại OTP cho người dùng.
     *
     * @param usernameOrEmail Username hoặc email
     */
    public void resendOtp(String usernameOrEmail) {
        User user = findUserByUsernameOrEmail(usernameOrEmail);

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendOtpMessage(user.getEmail(), "SecureVault - Gửi Lại Mã OTP",
                "Mã OTP mới của bạn là: " + otp);
    }

    /**
     * Yêu cầu reset mật khẩu - gửi OTP qua email.
     *
     * @param email Email người dùng
     */
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email này"));

        String otp = generateOtp();
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendOtpMessage(email, "SecureVault - Đặt Lại Mật Khẩu",
                "Mã OTP để đặt lại mật khẩu là: " + otp + ". Mã có hiệu lực trong 10 phút.");

        blockchain.addBlock("Yêu cầu đặt lại mật khẩu cho: " + user.getUsername());
    }

    /**
     * Đặt lại mật khẩu với OTP.
     *
     * @param email       Email người dùng
     * @param otp         Mã OTP
     * @param newPassword Mật khẩu mới
     */
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        validateOtp(user, otp);

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        blockchain.addBlock("Đặt lại mật khẩu thành công cho: " + user.getUsername());
    }

    /**
     * Đăng ký người dùng mới.
     *
     * @param request Thông tin đăng ký
     * @return User mới được tạo
     */
    public User registerUser(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .nationalId(request.getNationalId())
                .role(Role.ROLE_STAFF)
                .isEnabled(true)
                .build();

        userRepository.save(user);
        blockchain.addBlock("Người dùng mới đăng ký: " + user.getUsername());

        return user;
    }

    // ==================== Private Helper Methods ====================

    private String generateOtp() {
        return String.format("%06d", new Random().nextInt(999999));
    }

    private void validateOtp(User user, String otp) {
        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new RuntimeException("Yêu cầu OTP không hợp lệ");
        }

        if (LocalDateTime.now().isAfter(user.getOtpExpiry())) {
            throw new RuntimeException("Mã OTP đã hết hạn");
        }

        if (!user.getOtpCode().equals(otp)) {
            throw new RuntimeException("Mã OTP không đúng");
        }
    }

    private User findUserByUsernameOrEmail(String usernameOrEmail) {
        return userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }
}
