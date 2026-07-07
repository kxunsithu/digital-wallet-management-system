package com.digitalwallet.system.controller;

import com.digitalwallet.system.dto.TransferRequest;
import com.digitalwallet.system.entity.Transaction;
import com.digitalwallet.system.service.WalletService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final WalletService walletService;

    @PostMapping("/transfer")
    public ResponseEntity<Map<String, String>> transfer(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody TransferRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey
    ) {
        walletService.transfer(userDetails.getUsername(), request, idempotencyKey);
        return ResponseEntity.ok(Map.of("message", "Transfer successful"));
    }

    @GetMapping("/history")
    public ResponseEntity<Page<Transaction>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            Pageable pageable
    ) {
        return ResponseEntity.ok(walletService.getTransactionHistory(userDetails.getUsername(), pageable));
    }
}
