package com.example.digitalwallet;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@OpenAPIDefinition(info = @Info(title = "Digital Wallet Management API", version = "1.0", description = "Digital Wallet Backend API"))
public class DigitalWalletBackendApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(DigitalWalletBackendApiApplication.class, args);
    }
}
