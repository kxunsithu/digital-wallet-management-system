package com.example.digitalwallet.controller;

import com.example.digitalwallet.domain.entity.TransactionRecord;
import com.example.digitalwallet.dto.TransactionRequest;
import com.example.digitalwallet.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<TransactionRecord> executeTransaction(@Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(transactionService.executeTransaction(request));
    }
}
