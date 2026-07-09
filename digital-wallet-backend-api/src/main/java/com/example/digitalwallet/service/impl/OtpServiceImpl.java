package com.example.digitalwallet.service.impl;

import com.example.digitalwallet.domain.entity.OtpVerification;
import com.example.digitalwallet.dto.OtpRequest;
import com.example.digitalwallet.repository.OtpVerificationRepository;
import com.example.digitalwallet.service.OtpService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpServiceImpl implements OtpService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final WebClient webClient;
    private final String apiKey;
    private final String endpoint;

    public OtpServiceImpl(OtpVerificationRepository otpVerificationRepository,
                          WebClient webClient,
                          @Value("${infinireach.api-key}") String apiKey,
                          @Value("${infinireach.endpoint}") String endpoint) {
        this.otpVerificationRepository = otpVerificationRepository;
        this.webClient = webClient;
        this.apiKey = apiKey;
        this.endpoint = endpoint;
    }

    @Override
    public OtpVerification sendOtp(OtpRequest request) {
        String otpCode = generateOtpCode();
        OtpVerification verification = new OtpVerification();
        verification.setPhoneNumber(request.getPhoneNumber());
        verification.setPurpose(request.getPurpose() == null ? "GENERAL" : request.getPurpose());
        verification.setOtpCode(otpCode);
        verification.setExpiredAt(LocalDateTime.now().plusMinutes(5));

        // save before sending so we have a record even if sending fails
        OtpVerification saved = otpVerificationRepository.save(verification);

        try {
            webClient.post()
                    .uri(endpoint)
                    .header("Content-Type", "application/json")
                    .header("X-API-Key", apiKey)
                    .bodyValue(buildPayload(request.getPhoneNumber(), otpCode))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (WebClientResponseException ex) {
            // Log and return saved record; do not fail the entire request
            System.err.println("Failed to send OTP: " + ex.getMessage());
        }

        return saved;
    }

    private String buildPayload(String phoneNumber, String otpCode) {
        return String.format("{\"channel\":\"sms\",\"to\":\"%s\",\"from\":\"+959944074981\",\"message\":\"Your OTP code is: %s\"}", phoneNumber, otpCode);
    }

    private String generateOtpCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }
}
