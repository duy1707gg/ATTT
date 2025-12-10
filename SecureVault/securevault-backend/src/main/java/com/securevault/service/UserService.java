package com.securevault.service;

import com.securevault.blockchain.Blockchain;
import com.securevault.entity.User;
import com.securevault.enums.Role;
import com.securevault.payload.request.SignupRequest;
import com.securevault.payload.request.UpdateProfileRequest;
import com.securevault.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Service xử lý logic quản lý người dùng.
 * Bao gồm: CRUD users, quản lý profile.
 */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Blockchain blockchain;

    public UserService(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            Blockchain blockchain) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.blockchain = blockchain;
    }

    /**
     * Lấy danh sách tất cả người dùng.
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Lấy thông tin người dùng theo ID.
     */
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
    }

    /**
     * Tạo người dùng mới (Admin only).
     */
    public User createUser(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Tên đăng nhập đã tồn tại!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        Role role = determineRole(request.getRole());

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .nationalId(request.getNationalId())
                .role(role)
                .isEnabled(true)
                .build();

        userRepository.save(user);
        blockchain.addBlock("Admin tạo người dùng mới: " + user.getUsername());

        return user;
    }

    /**
     * Xóa người dùng.
     */
    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
        blockchain.addBlock("Admin xóa người dùng: " + user.getUsername());
    }

    /**
     * Cập nhật trạng thái enabled/disabled của người dùng.
     */
    public void updateUserStatus(Long id, boolean enabled) {
        User user = getUserById(id);
        user.setEnabled(enabled);
        userRepository.save(user);
    }

    /**
     * Cập nhật thông tin profile người dùng.
     */
    public void updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserById(userId);

        user.setFullName(request.getFullName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setNationalId(request.getNationalId());

        userRepository.save(user);
        blockchain.addBlock("Người dùng cập nhật profile: " + user.getUsername());
    }

    // ==================== Private Helper Methods ====================

    private Role determineRole(Set<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return Role.ROLE_STAFF;
        }

        String roleName = roles.iterator().next().toLowerCase();
        return switch (roleName) {
            case "admin" -> Role.ROLE_ADMIN;
            case "manager" -> Role.ROLE_MANAGER;
            default -> Role.ROLE_STAFF;
        };
    }
}
