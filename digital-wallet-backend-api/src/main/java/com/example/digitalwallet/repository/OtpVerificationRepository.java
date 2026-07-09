package com.example.digitalwallet.repository;

import com.example.digitalwallet.domain.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findTopByPhoneNumberAndPurposeOrderByCreatedAtDesc(String phoneNumber, String purpose);
}
