package com.infinireach.otp.controller;

import com.infinireach.otp.dto.SendOTPRequest;
import com.infinireach.otp.dto.VerifyOTPRequest;
import com.infinireach.otp.dto.OTPResponse;
import com.infinireach.otp.service.OTPService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for OTP Authentication endpoints
 * Provides two main endpoints:
 * 1. POST /api/auth/send-otp - Send OTP to phone number
 * 2. POST /api/auth/verify-otp - Verify OTP code
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final OTPService otpService;

    public AuthController(OTPService otpService) {
        this.otpService = otpService;
    }

    /**
     * Send OTP to specified phone number
     *
     * Endpoint: POST /api/auth/send-otp
     * Request Body:
     * {
     *   "phoneNumber": "+1234567890"
     * }
     *
     * Response (Success - 200 OK):
     * {
     *   "success": true,
     *   "message": "OTP sent successfully to +1234567890",
     *   "phoneNumber": "+1234567890"
     * }
     *
     * Response (Error - 400 Bad Request):
     * {
     *   "success": false,
     *   "message": "Phone number cannot be empty",
     *   "phoneNumber": null
     * }
     *
     * Process:
     * 1. Accepts phone number from request body
     * 2. Generates a secure 6-digit random numeric OTP
     * 3. Saves OTP to PostgreSQL with 5-minute expiration time
     * 4. Triggers HttpClient to send SMS via Infinireach API endpoint
     * 5. Returns response with status and message
     *
     * @param request SendOTPRequest containing phone number
     * @return ResponseEntity with OTPResponse
     */
    @PostMapping("/send-otp")
    public ResponseEntity<OTPResponse> sendOTP(@RequestBody SendOTPRequest request) {
        log.info("Received send OTP request for phone: {}", request.getPhoneNumber());

        if (request.getPhoneNumber() == null || request.getPhoneNumber().trim().isEmpty()) {
            log.warn("Invalid request: empty phone number");
            OTPResponse response = OTPResponse.builder()
                    .success(false)
                    .message("Phone number is required")
                    .build();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        OTPResponse response = otpService.sendOTP(request.getPhoneNumber());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Verify OTP for given phone number
     *
     * Endpoint: POST /api/auth/verify-otp
     * Request Body:
     * {
     *   "phoneNumber": "+1234567890",
     *   "otpCode": "123456"
     * }
     *
     * Response (Success - 200 OK):
     * {
     *   "success": true,
     *   "message": "OTP verified successfully",
     *   "isVerified": true,
     *   "phoneNumber": "+1234567890"
     * }
     *
     * Response (Error - Invalid OTP - 400 Bad Request):
     * {
     *   "success": false,
     *   "message": "Invalid OTP code",
     *   "isVerified": false,
     *   "phoneNumber": "+1234567890"
     * }
     *
     * Response (Error - Expired OTP - 400 Bad Request):
     * {
     *   "success": false,
     *   "message": "OTP has expired. Please request a new OTP.",
     *   "isVerified": false,
     *   "phoneNumber": "+1234567890"
     * }
     *
     * Verification Logic:
     * 1. Accepts phone number and OTP code from request body
     * 2. Retrieves the latest OTP record for the phone number from database
     * 3. Verifies if OTP code matches the stored code
     * 4. Verifies if OTP has not expired by checking: LocalDateTime.now().isBefore(expiryTime)
     *    - If LocalDateTime.now() is BEFORE expiryTime → OTP is VALID
     *    - If LocalDateTime.now() is EQUAL TO or AFTER expiryTime → OTP is EXPIRED
     * 5. If both checks pass, updates is_verified flag to true in database
     * 6. Returns response with verification status
     *
     * @param request VerifyOTPRequest containing phone number and OTP code
     * @return ResponseEntity with OTPResponse containing verification status
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<OTPResponse> verifyOTP(@RequestBody VerifyOTPRequest request) {
        log.info("Received verify OTP request for phone: {}", request.getPhoneNumber());

        if (request.getPhoneNumber() == null || request.getPhoneNumber().trim().isEmpty()) {
            log.warn("Invalid request: empty phone number");
            OTPResponse response = OTPResponse.builder()
                    .success(false)
                    .message("Phone number is required")
                    .build();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (request.getOtpCode() == null || request.getOtpCode().trim().isEmpty()) {
            log.warn("Invalid request: empty OTP code");
            OTPResponse response = OTPResponse.builder()
                    .success(false)
                    .message("OTP code is required")
                    .build();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        OTPResponse response = otpService.verifyOTP(request.getPhoneNumber(), request.getOtpCode());

        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    /**
     * Health check endpoint to verify API is running
     *
     * @return ResponseEntity with status message
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        log.info("Health check request received");
        return ResponseEntity.ok("OTP Authentication Engine is running");
    }

}
