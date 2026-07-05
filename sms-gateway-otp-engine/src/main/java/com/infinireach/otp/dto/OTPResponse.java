package com.infinireach.otp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for OTP API responses
 * Contains standard response information for both Send and Verify OTP endpoints
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OTPResponse {

    /**
     * Success or failure status of the operation
     */
    private Boolean success;

    /**
     * Human-readable message describing the result
     */
    private String message;

    /**
     * Optional error details for debugging
     */
    private String errorDetails;

    /**
     * Phone number involved in the operation
     */
    private String phoneNumber;

    /**
     * Verification status (for verify endpoint)
     */
    private Boolean isVerified;

    /**
     * OTP code returned for local/dev testing purposes
     */
    private String otpCode;

}
