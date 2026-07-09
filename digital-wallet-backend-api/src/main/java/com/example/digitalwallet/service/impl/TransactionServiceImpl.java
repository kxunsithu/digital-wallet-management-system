package com.example.digitalwallet.service.impl;

import com.example.digitalwallet.domain.entity.TransactionRecord;
import com.example.digitalwallet.domain.entity.Wallet;
import com.example.digitalwallet.domain.enums.TransactionStatus;
import com.example.digitalwallet.domain.enums.TransactionType;
import com.example.digitalwallet.dto.TransactionRequest;
import com.example.digitalwallet.repository.TransactionRepository;
import com.example.digitalwallet.repository.WalletRepository;
import com.example.digitalwallet.service.TransactionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class TransactionServiceImpl implements TransactionService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

    public TransactionServiceImpl(WalletRepository walletRepository,
                                  TransactionRepository transactionRepository) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional
    public TransactionRecord executeTransaction(TransactionRequest request) {
        if (transactionRepository.findByIdempotencyKey(request.getIdempotencyKey()).isPresent()) {
            throw new IllegalArgumentException("Duplicate idempotency key");
        }

        TransactionType type = TransactionType.valueOf(request.getTransactionType().toUpperCase());
        TransactionRecord transaction = new TransactionRecord();
        transaction.setTransactionNo("TXN-" + UUID.randomUUID());
        transaction.setAmount(request.getAmount());
        transaction.setTransactionType(type);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction.setIdempotencyKey(request.getIdempotencyKey());
        transaction.setDescription(request.getDescription());

        Wallet sender = null;
        Wallet receiver = null;

        if (request.getSenderWalletId() != null) {
            sender = walletRepository.findById(request.getSenderWalletId())
                    .orElseThrow(() -> new IllegalArgumentException("Sender wallet not found"));
        }

        if (request.getReceiverWalletId() != null) {
            receiver = walletRepository.findById(request.getReceiverWalletId())
                    .orElseThrow(() -> new IllegalArgumentException("Receiver wallet not found"));
        }

        switch (type) {
            case TRANSFER, QR_TRANSFER -> performDebitCredit(sender, receiver, request.getAmount());
            case CASH_IN, CASH_OUT, ADMIN_TOP_UP, ADMIN_BONUS -> performDebitCredit(sender, receiver, request.getAmount());
            default -> throw new IllegalArgumentException("Unsupported transaction type");
        }

        transaction.setSenderWallet(sender);
        transaction.setReceiverWallet(receiver);
        transaction.setStatus(TransactionStatus.SUCCESS);
        return transactionRepository.save(transaction);
    }

    private void performDebitCredit(Wallet sender, Wallet receiver, BigDecimal amount) {
        if (sender == null || receiver == null) {
            throw new IllegalArgumentException("Both sender and receiver wallets are required for this transaction");
        }
        if (sender.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient wallet balance");
        }

        sender.setBalance(sender.getBalance().subtract(amount));
        receiver.setBalance(receiver.getBalance().add(amount));
        walletRepository.save(sender);
        walletRepository.save(receiver);
    }
}
