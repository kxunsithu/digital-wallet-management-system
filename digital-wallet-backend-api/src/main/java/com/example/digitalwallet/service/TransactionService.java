package com.example.digitalwallet.service;

import com.example.digitalwallet.domain.entity.TransactionRecord;
import com.example.digitalwallet.dto.TransactionRequest;

public interface TransactionService {
    TransactionRecord executeTransaction(TransactionRequest request);
}
