package com.digitalwallet.system.repository;

import com.digitalwallet.system.entity.Transaction;
import com.digitalwallet.system.entity.Wallet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
    
    @Query("SELECT t FROM Transaction t WHERE t.senderWallet = :wallet OR t.receiverWallet = :wallet ORDER BY t.createdAt DESC")
    Page<Transaction> findByWallet(Wallet wallet, Pageable pageable);
}
