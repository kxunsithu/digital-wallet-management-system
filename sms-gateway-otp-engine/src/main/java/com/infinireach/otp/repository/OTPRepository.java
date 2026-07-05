package com.infinireach.otp.repository;

import com.infinireach.otp.model.PhoneAuthentication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * JPA Repository interface for PhoneAuthentication entity
 * Provides database access methods for OTP operations
 * Extends JpaRepository for standard CRUD operations
 *
 * @author OTP Engine Team
 * @version 1.0.0
 */
@Repository
public interface OTPRepository extends JpaRepository<PhoneAuthentication, Long> {

    /**
     * Find the most recent OTP record for a given phone number
     *
     * @param phoneNumber the phone number to search for
     * @return Optional containing the latest OTP record if found
     */
    @Query(value = "SELECT * FROM phone_authentications WHERE phone_number = :phoneNumber ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<PhoneAuthentication> findLatestByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    /**
     * Find an OTP record by phone number and OTP code
     * Used during verification process
     *
     * @param phoneNumber the phone number
     * @param otpCode the OTP code to verify
     * @return Optional containing the record if both match
     */
    @Query(value = "SELECT * FROM phone_authentications WHERE phone_number = :phoneNumber AND otp_code = :otpCode ORDER BY created_at DESC LIMIT 1", nativeQuery = true)
    Optional<PhoneAuthentication> findByPhoneNumberAndOtpCode(
            @Param("phoneNumber") String phoneNumber,
            @Param("otpCode") String otpCode
    );

}
