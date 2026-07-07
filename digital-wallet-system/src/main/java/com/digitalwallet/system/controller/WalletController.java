package com.digitalwallet.system.controller;

import com.digitalwallet.system.entity.Transaction;
import com.digitalwallet.system.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<Map<String, BigDecimal>> getBalance(@AuthenticationPrincipal UserDetails userDetails) {
        BigDecimal balance = walletService.getBalance(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("balance", balance));
    }
}
