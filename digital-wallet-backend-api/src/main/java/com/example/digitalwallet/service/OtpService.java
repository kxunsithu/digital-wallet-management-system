package com.example.digitalwallet.service;

import com.example.digitalwallet.domain.entity.OtpVerification;
import com.example.digitalwallet.dto.OtpRequest;

public interface OtpService {
    OtpVerification sendOtp(OtpRequest request);
}
