package com.example.digitalwallet.controller;

import com.example.digitalwallet.domain.entity.OtpVerification;
import com.example.digitalwallet.dto.OtpRequest;
import com.example.digitalwallet.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthOtpController {

    private final OtpService otpService;

    public AuthOtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<OtpVerification> sendOtp(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(otpService.sendOtp(request));
    }
}
