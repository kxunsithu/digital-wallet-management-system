package com.digitalwallet.system.dto;

import com.digitalwallet.system.entity.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String phoneNumber;
    @NotBlank
    private String password;
    @NotBlank
    private String fullName;
    @NotNull
    private UserRole role;
}
