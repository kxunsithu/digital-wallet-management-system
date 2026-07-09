package com.example.digitalwallet.service.impl;

import com.example.digitalwallet.domain.entity.User;
import com.example.digitalwallet.domain.entity.UserDeviceToken;
import com.example.digitalwallet.domain.enums.UserRole;
import com.example.digitalwallet.dto.AuthResponse;
import com.example.digitalwallet.dto.LoginRequest;
import com.example.digitalwallet.dto.RegisterRequest;
import com.example.digitalwallet.repository.UserDeviceTokenRepository;
import com.example.digitalwallet.repository.UserRepository;
import com.example.digitalwallet.security.JwtTokenProvider;
import com.example.digitalwallet.service.AuthService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserDeviceTokenRepository deviceTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserRepository userRepository,
                           UserDeviceTokenRepository deviceTokenRepository,
                           JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            throw new IllegalStateException("Phone number already registered");
        }

        UserRole userRole;
        try {
            userRole = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new IllegalArgumentException("Invalid role. Allowed values: CUSTOMER, AGENT, ADMIN");
        }

        User user = new User();
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(userRole);
        user.setIsActive(true);

        userRepository.save(user);

        String token = jwtTokenProvider.createToken(user.getPhoneNumber(), user.getRole().name());
        return new AuthResponse(token);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseThrow(() -> new IllegalArgumentException("Invalid phone number or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid phone number or password");
        }

        String token = jwtTokenProvider.createToken(user.getPhoneNumber(), user.getRole().name());
        upsertDeviceToken(user, request.getDeviceToken(), request.getDeviceType());
        return new AuthResponse(token);
    }

    private void upsertDeviceToken(User user, String deviceToken, String deviceType) {
        UserDeviceToken existing = deviceTokenRepository.findByUser(user).orElse(null);

        if (existing == null) {
            UserDeviceToken newToken = new UserDeviceToken();
            newToken.setUser(user);
            newToken.setDeviceToken(deviceToken);
            newToken.setDeviceType(deviceType);
            deviceTokenRepository.save(newToken);
            return;
        }

        existing.setDeviceToken(deviceToken);
        existing.setDeviceType(deviceType);
        existing.setUpdatedAt(java.time.LocalDateTime.now());
        deviceTokenRepository.save(existing);
    }
}
