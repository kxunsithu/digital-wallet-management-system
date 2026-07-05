package com.infinireach.otp.service;

import com.infinireach.otp.dto.OTPResponse;
import com.infinireach.otp.dto.SmsPayload;
import com.infinireach.otp.model.PhoneAuthentication;
import com.infinireach.otp.repository.OTPRepository;
import com.infinireach.otp.util.OTPGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Service layer for OTP operations
 * Handles:
 * - OTP generation
 * - OTP storage and retrieval from PostgreSQL
 * - SMS sending via Infinireach API using Java 11+ HttpClient
 * - OTP verification
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
@Slf4j
@Service
public class OTPService {

    private final OTPRepository otpRepository;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${infinireach.api.endpoint}")
    private String infiniReachApiEndpoint;

    @Value("${infinireach.api.token}")
    private String infiniReachApiToken;

    @Value("${infinireach.api.content-type}")
    private String contentType;

    @Value("${otp.expiry.minutes:5}")
    private int otpExpiryMinutes;

    @Value("${otp.sms.test-mode:false}")
    private boolean smsTestMode;

    public OTPService(OTPRepository otpRepository) {
        this.otpRepository = otpRepository;
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Send OTP to the specified phone number
     * Steps:
     * 1. Generate a secure 6-digit OTP
     * 2. Save/Update OTP in PostgreSQL with 5-minute expiration
     * 3. Send SMS via Infinireach API using HttpClient
     *
     * @param phoneNumber the recipient phone number
     * @return OTPResponse with status and message
     */
    public OTPResponse sendOTP(String phoneNumber) {
        log.info("Processing send OTP request for phone number: {}", phoneNumber);

        try {
            // Validate phone number
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                log.warn("Invalid phone number provided: empty or null");
                return OTPResponse.builder()
                        .success(false)
                        .message("Phone number cannot be empty")
                        .phoneNumber(phoneNumber)
                        .build();
            }

            // Step 1: Generate secure 6-digit OTP
            String otp = OTPGenerator.generateOTP();
            log.debug("Generated OTP: {} for phone number: {}", otp, phoneNumber);

            // Step 2: Save/Update OTP in PostgreSQL with 5-minute expiration
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(otpExpiryMinutes);
            PhoneAuthentication phoneAuth = PhoneAuthentication.builder()
                    .phoneNumber(phoneNumber)
                    .otpCode(otp)
                    .expiryTime(expiryTime)
                    .isVerified(false)
                    .build();

            phoneAuth = otpRepository.save(phoneAuth);
            log.info("OTP saved to PostgreSQL for phone number: {} with expiry: {}", phoneNumber, expiryTime);

            // Step 3: Send SMS via Infinireach API using HttpClient
            boolean smsSent = sendSmsViaInfinireach(phoneNumber, otp);

            if (smsSent) {
                log.info("OTP SMS successfully sent to: {}", phoneNumber);
                return OTPResponse.builder()
                        .success(true)
                        .message("OTP sent successfully to " + phoneNumber)
                        .phoneNumber(phoneNumber)
                        .otpCode(otp)
                        .build();
            } else {
                log.error("Failed to send OTP SMS to: {}", phoneNumber);

                if (smsTestMode) {
                    log.warn("SMS test mode enabled. Returning OTP in response for local testing.");
                    return OTPResponse.builder()
                            .success(true)
                            .message("OTP generated and stored successfully. SMS gateway unavailable; using test mode.")
                            .errorDetails("External SMS gateway failed. OTP is available for local testing.")
                            .phoneNumber(phoneNumber)
                            .otpCode(otp)
                            .build();
                }

                return OTPResponse.builder()
                        .success(false)
                        .message("Failed to send OTP SMS")
                        .errorDetails("SMS gateway returned error")
                        .phoneNumber(phoneNumber)
                        .otpCode(otp)
                        .build();
            }

        } catch (Exception e) {
            log.error("Error while sending OTP to phone number: {}", phoneNumber, e);
            return OTPResponse.builder()
                    .success(false)
                    .message("Error processing OTP request")
                    .errorDetails(e.getMessage())
                    .phoneNumber(phoneNumber)
                    .build();
        }
    }

    /**
     * Send SMS via Infinireach API using Java 11+ HttpClient.
     * Tries a small set of reasonable endpoint and payload variants so the
     * integration can work with the real provider when a valid token is configured.
     *
     * @param phoneNumber the recipient phone number
     * @param otp the OTP code
     * @return true if SMS sent successfully, false otherwise
     */
    private boolean sendSmsViaInfinireach(String phoneNumber, String otp) {
        String message = "Your OTP code is: " + otp;
        List<String> endpoints = new ArrayList<>();
        endpoints.add(infiniReachApiEndpoint);
        String baseEndpoint = infiniReachApiEndpoint == null ? "" : infiniReachApiEndpoint.trim();
        if (!baseEndpoint.isEmpty()) {
            String normalized = baseEndpoint.endsWith("/") ? baseEndpoint.substring(0, baseEndpoint.length() - 1) : baseEndpoint;
            endpoints.add(normalized + "/api/v1/send");
            endpoints.add(normalized + "/api/send");
            endpoints.add(normalized + "/send");
            endpoints.add(normalized + "/api/v1/sms/send");
            endpoints.add(normalized + "/api/sms/send");
        }

        List<String> authValues = new ArrayList<>();
        if (infiniReachApiToken != null && !infiniReachApiToken.isBlank()) {
            authValues.add("Bearer " + infiniReachApiToken.trim());
            authValues.add(infiniReachApiToken.trim());
        }

        List<String> payloadBodies = new ArrayList<>();
        payloadBodies.add("{\"channel\":\"sms\",\"to\":\"" + phoneNumber + "\",\"from\":\"+959944074981\",\"message\":\"" + message + "\"}");
        payloadBodies.add("{\"channel\":\"sms\",\"to\":\"" + phoneNumber + "\",\"from\":\"+959944074981\",\"text\":\"" + message + "\"}");
        payloadBodies.add("{\"channel\":\"sms\",\"to\":\"" + phoneNumber + "\",\"from\":\"+959944074981\",\"body\":\"" + message + "\"}");
        payloadBodies.add("{\"channel\":\"sms\",\"to\":\"" + phoneNumber + "\",\"from\":\"+959944074981\",\"message\":\"" + message + "\",\"from\":\"+959944074981\"}");

        for (String endpoint : endpoints) {
            for (String authValue : authValues) {
                for (String jsonBody : payloadBodies) {
                    try {
                        log.debug("Trying SMS endpoint {} with payload {}", endpoint, jsonBody);
                        HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                                .uri(URI.create(endpoint))
                                .header("Content-Type", contentType)
                                .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

                        if (infiniReachApiToken != null && !infiniReachApiToken.isBlank()) {
                            reqBuilder.header("X-API-Key", infiniReachApiToken.trim());
                        }

                        HttpRequest request = reqBuilder.build();

                        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                        if (response.statusCode() >= 200 && response.statusCode() < 300) {
                            log.info("SMS sent successfully. Response status: {}", response.statusCode());
                            log.debug("Response body: {}", response.body());
                            return true;
                        }

                        log.warn("SMS attempt failed for endpoint {} with status {} and body {}", endpoint, response.statusCode(), response.body());
                    } catch (Exception e) {
                        log.warn("Exception while calling SMS endpoint {}", endpoint, e);
                    }
                }
            }
        }

        log.error("All SMS delivery attempts failed for phone number: {}", phoneNumber);
        return false;
    }

    /**
     * Verify OTP for a given phone number
     *
     * Verification Process:
     * 1. Find the latest OTP record for the phone number
     * 2. Check if OTP code matches
     * 3. Check if OTP has not expired by comparing LocalDateTime.now() with expiryTime
     * 4. Mark phone number as verified if both checks pass
     * 5. Return appropriate response
     *
     * Timestamp Comparison Logic:
     * - Current time must be BEFORE the expiry time for OTP to be valid
     * - If LocalDateTime.now() is BEFORE expiryTime → OTP is VALID
     * - If LocalDateTime.now() is EQUAL TO or AFTER expiryTime → OTP is EXPIRED
     *
     * @param phoneNumber the phone number to verify
     * @param otpCode the OTP code provided by user
     * @return OTPResponse with verification status
     */
    public OTPResponse verifyOTP(String phoneNumber, String otpCode) {
        log.info("Processing verify OTP request for phone number: {}", phoneNumber);

        try {
            // Validate inputs
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                log.warn("Invalid phone number provided for verification");
                return OTPResponse.builder()
                        .success(false)
                        .message("Phone number cannot be empty")
                        .isVerified(false)
                        .build();
            }

            if (otpCode == null || otpCode.trim().isEmpty()) {
                log.warn("Invalid OTP code provided for verification");
                return OTPResponse.builder()
                        .success(false)
                        .message("OTP code cannot be empty")
                        .isVerified(false)
                        .phoneNumber(phoneNumber)
                        .build();
            }

            // Step 1: Find the latest OTP record for the phone number
            Optional<PhoneAuthentication> authRecord = otpRepository.findLatestByPhoneNumber(phoneNumber);

            if (authRecord.isEmpty()) {
                log.warn("No OTP record found for phone number: {}", phoneNumber);
                return OTPResponse.builder()
                        .success(false)
                        .message("No OTP found for this phone number. Please request a new OTP.")
                        .isVerified(false)
                        .phoneNumber(phoneNumber)
                        .build();
            }

            PhoneAuthentication phoneAuth = authRecord.get();

            // Step 2: Check if OTP code matches
            if (!phoneAuth.getOtpCode().equals(otpCode)) {
                log.warn("OTP code mismatch for phone number: {}", phoneNumber);
                return OTPResponse.builder()
                        .success(false)
                        .message("Invalid OTP code")
                        .isVerified(false)
                        .phoneNumber(phoneNumber)
                        .build();
            }

            // Step 3: Check if OTP has not expired
            // Timestamp Comparison Explanation:
            // LocalDateTime.now() returns the current date and time
            // expiryTime is the expiration timestamp stored in database
            // If LocalDateTime.now().isBefore(expiryTime) returns TRUE:
            //   - Current time is BEFORE expiry time → OTP is VALID (not expired)
            // If LocalDateTime.now().isBefore(expiryTime) returns FALSE:
            //   - Current time is EQUAL TO or AFTER expiry time → OTP is EXPIRED (no longer valid)

            if (LocalDateTime.now().isBefore(phoneAuth.getExpiryTime())) {
                // OTP is not expired - VALID
                log.debug("OTP is valid (not expired). Current time: {}, Expiry time: {}",
                        LocalDateTime.now(), phoneAuth.getExpiryTime());

                // Step 4: Mark phone number as verified
                phoneAuth.setIsVerified(true);
                otpRepository.save(phoneAuth);
                log.info("OTP verified successfully for phone number: {}", phoneNumber);

                return OTPResponse.builder()
                        .success(true)
                        .message("OTP verified successfully")
                        .isVerified(true)
                        .phoneNumber(phoneNumber)
                        .build();
            } else {
                // OTP has expired - INVALID
                log.warn("OTP has expired for phone number: {}. Current time: {}, Expiry time: {}",
                        phoneNumber, LocalDateTime.now(), phoneAuth.getExpiryTime());

                return OTPResponse.builder()
                        .success(false)
                        .message("OTP has expired. Please request a new OTP.")
                        .isVerified(false)
                        .phoneNumber(phoneNumber)
                        .build();
            }

        } catch (Exception e) {
            log.error("Error while verifying OTP for phone number: {}", phoneNumber, e);
            return OTPResponse.builder()
                    .success(false)
                    .message("Error processing OTP verification")
                    .errorDetails(e.getMessage())
                    .isVerified(false)
                    .phoneNumber(phoneNumber)
                    .build();
        }
    }

}
