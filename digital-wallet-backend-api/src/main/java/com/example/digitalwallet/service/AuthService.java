package com.example.digitalwallet.service;

import com.example.digitalwallet.dto.AuthResponse;
import com.example.digitalwallet.dto.LoginRequest;
import com.example.digitalwallet.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
