package com.example.digitalwallet.controller;

import com.example.digitalwallet.domain.entity.OtpVerification;
import com.example.digitalwallet.dto.OtpRequest;
import com.example.digitalwallet.service.OtpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/send")
    public ResponseEntity<OtpVerification> sendOtp(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(otpService.sendOtp(request));
    }

    @PostMapping("/api/auth/send-otp")
    public ResponseEntity<OtpVerification> sendOtpLegacy(@Valid @RequestBody OtpRequest request) {
        return ResponseEntity.ok(otpService.sendOtp(request));
    }
}

