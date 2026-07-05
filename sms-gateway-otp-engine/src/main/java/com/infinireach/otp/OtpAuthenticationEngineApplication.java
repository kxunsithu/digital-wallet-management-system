package com.infinireach.otp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main Spring Boot Application class for OTP Authentication Engine
 * Integrates with Infinireach SMS Gateway for sending OTP via SMS
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
@SpringBootApplication
public class OtpAuthenticationEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(OtpAuthenticationEngineApplication.class, args);
    }

}
