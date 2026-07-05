package com.infinireach.otp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Verify OTP API request
 * Contains phone number and OTP code for verification
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyOTPRequest {

    /**
     * Phone number that was used to request OTP
     */
    private String phoneNumber;

    /**
     * 6-digit OTP code to verify
     */
    private String otpCode;

}
