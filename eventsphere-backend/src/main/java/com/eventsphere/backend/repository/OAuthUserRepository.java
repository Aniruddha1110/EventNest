package com.eventsphere.backend.repository;

import com.eventsphere.backend.entity.OAuthUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for OAuthUser — scanned by OracleDataSourceConfig
 * (it lives in com.eventsphere.backend.repository, not .bank or .h2).
 */
@Repository
public interface OAuthUserRepository extends JpaRepository<OAuthUser, String> {

    /** Find by email (case-insensitive) — used to detect returning OAuth2 users. */
    Optional<OAuthUser> findByOauthEmailIgnoreCase(String email);

    boolean existsByOauthEmail(String email);

    boolean existsByOauthUsername(String username);
}