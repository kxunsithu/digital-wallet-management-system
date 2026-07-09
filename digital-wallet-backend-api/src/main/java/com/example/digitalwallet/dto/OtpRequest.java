package com.example.digitalwallet.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpRequest {

    @NotBlank
    private String phoneNumber;

    private String purpose;

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}
