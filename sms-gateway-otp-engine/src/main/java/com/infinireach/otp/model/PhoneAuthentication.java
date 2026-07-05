package com.infinireach.otp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * JPA Entity representing a phone number authentication record with OTP
 * Stores OTP details for phone number verification
 *
 * Database Table: phone_authentications
 */
@Entity
@Table(name = "phone_authentications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhoneAuthentication {

    /**
     * Unique identifier for each authentication record
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Phone number in international or local format
     * Should be validated and normalized
     */
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    /**
     * One-Time Password (6-digit numeric code)
     * Should be stored securely
     */
    @Column(name = "otp_code", nullable = false, length = 6)
    private String otpCode;

    /**
     * Timestamp when the OTP expires
     * OTP is considered invalid after this time
     */
    @Column(name = "expiry_time", nullable = false)
    private LocalDateTime expiryTime;

    /**
     * Flag to indicate if the phone number has been verified
     * True means the OTP was successfully verified
     * Default: FALSE
     */
    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    /**
     * Timestamp when the record was created
     * Automatically set by JPA
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the record was last updated
     * Automatically updated by JPA
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * PrePersist callback - sets creation and update timestamps
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /**
     * PreUpdate callback - updates the update timestamp
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
