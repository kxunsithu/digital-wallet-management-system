package com.infinireach.otp.util;

import java.security.SecureRandom;

/**
 * Utility class for generating secure OTP codes
 * Uses SecureRandom for cryptographically strong random number generation
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
public class OTPGenerator {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_LENGTH = 6;
    private static final int OTP_RANGE = 999999; // 0-999999 for 6 digits

    /**
     * Generate a secure 6-digit OTP code
     * Format: Always 6 digits (e.g., 003456, 123456, 098765)
     *
     * @return A 6-digit OTP code as a String
     */
    public static String generateOTP() {
        // Generate random number between 0 and 999999
        int randomNumber = SECURE_RANDOM.nextInt(OTP_RANGE + 1);

        // Format to 6 digits with leading zeros if necessary
        return String.format("%06d", randomNumber);
    }

    /**
     * Generate OTP of custom length
     *
     * @param length the desired OTP length
     * @return An OTP code of specified length
     */
    public static String generateOTP(int length) {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < length; i++) {
            otp.append(SECURE_RANDOM.nextInt(10));
        }
        return otp.toString();
    }

}
