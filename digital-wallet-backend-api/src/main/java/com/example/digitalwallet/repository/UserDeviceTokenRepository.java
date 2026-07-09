package com.example.digitalwallet.repository;

import com.example.digitalwallet.domain.entity.User;
import com.example.digitalwallet.domain.entity.UserDeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserDeviceTokenRepository extends JpaRepository<UserDeviceToken, Long> {
    Optional<UserDeviceToken> findByUser(User user);
    Optional<UserDeviceToken> findByDeviceToken(String deviceToken);
}
