package com.digitalwallet.system.service;

import com.digitalwallet.system.dto.TransferRequest;
import com.digitalwallet.system.entity.*;
import com.digitalwallet.system.repository.TransactionRepository;
import com.digitalwallet.system.repository.UserRepository;
import com.digitalwallet.system.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public BigDecimal getBalance(String phoneNumber) {
        return walletRepository.findByUserPhoneNumber(phoneNumber)
                .map(Wallet::getBalance)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional
    public void transfer(String senderPhone, TransferRequest request, String idempotencyKey) {
        // Check idempotency
        if (idempotencyKey != null && transactionRepository.findByIdempotencyKey(idempotencyKey).isPresent()) {
            return;
        }

        Wallet senderWallet = walletRepository.findByUserPhoneNumber(senderPhone)
                .orElseThrow(() -> new RuntimeException("Sender wallet not found"));

        Wallet receiverWallet = walletRepository.findByUserPhoneNumber(request.getReceiverPhoneNumber())
                .orElseThrow(() -> new RuntimeException("Receiver wallet not found"));

        if (senderWallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        // Update balances
        senderWallet.setBalance(senderWallet.getBalance().subtract(request.getAmount()));
        receiverWallet.setBalance(receiverWallet.getBalance().add(request.getAmount()));

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        // Create transaction record
        Transaction transaction = Transaction.builder()
                .transactionNo(UUID.randomUUID().toString())
                .senderWallet(senderWallet)
                .receiverWallet(receiverWallet)
                .amount(request.getAmount())
                .transactionType(TransactionType.CUSTOMER_TRANSFER)
                .status(TransactionStatus.SUCCESS)
                .idempotencyKey(idempotencyKey)
                .description(request.getDescription())
                .build();

        transactionRepository.save(transaction);
    }

    public Page<Transaction> getTransactionHistory(String phoneNumber, Pageable pageable) {
        Wallet wallet = walletRepository.findByUserPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
        return transactionRepository.findByWallet(wallet, pageable);
    }
}
