package com.infinireach.otp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Send OTP API request
 * Contains the phone number for which OTP needs to be sent
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendOTPRequest {

    /**
     * Phone number in international format or local format
     * Example: +1234567890 or 1234567890
     */
    private String phoneNumber;

}
