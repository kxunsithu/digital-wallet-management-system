package com.infinireach.otp.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Infinireach SMS Gateway API payload
 * Represents the JSON body sent to the SMS relay API
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmsPayload {

    /**
     * Recipient phone number
     * Expected format: international or local format depending on SMS gateway
     */
    @JsonProperty("to")
    private String to;

    /**
     * SMS message content
     * Contains the OTP code and instructions for the user
     */
    @JsonProperty("message")
    private String message;

}
