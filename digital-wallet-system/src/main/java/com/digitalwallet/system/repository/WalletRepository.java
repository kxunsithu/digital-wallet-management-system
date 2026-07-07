package com.digitalwallet.system.repository;

import com.digitalwallet.system.entity.User;
import com.digitalwallet.system.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WalletRepository extends JpaRepository<Wallet, Long> {
    Optional<Wallet> findByUser(User user);
    Optional<Wallet> findByUserPhoneNumber(String phoneNumber);
}
