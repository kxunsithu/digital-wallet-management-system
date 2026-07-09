package com.example.digitalwallet.repository;

import com.example.digitalwallet.domain.entity.User;
import com.example.digitalwallet.domain.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByUser(User user);
}
