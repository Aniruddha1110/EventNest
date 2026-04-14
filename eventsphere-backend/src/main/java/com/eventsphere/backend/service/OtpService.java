package com.eventsphere.backend.service;

import com.eventsphere.backend.util.OtpGenerator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * OTP service — generates, stores, and validates 6-digit OTPs.
 *
 * Storage: ConcurrentHashMap in memory (not DB).
 * Key:     email address (lowercase)
 * Value:   OtpEntry { otp, createdAt }
 * TTL:     10 minutes (600,000 ms)
 *
 * Flow:
 *   1. ForgotPasswordRequest → generateAndStore(email) → send via MailService
 *   2. VerifyOtpRequest      → verify(email, otp)       → HTTP 200 or 401
 *   3. ResetPasswordRequest  → verify again + clearOtp(email)
 */
@Service
@Slf4j
public class OtpService {

    private static final long TTL_MS = 10 * 60 * 1_000L; // 10 minutes

    // Thread-safe map: email → OtpEntry
    private final ConcurrentHashMap<String, OtpEntry> store = new ConcurrentHashMap<>();

    /**
     * Generates a 6-digit OTP, stores it, and returns it for the caller (MailService) to send.
     */
    public String generateAndStore(String email) {
        String otp = OtpGenerator.generate();
        store.put(email.toLowerCase(), new OtpEntry(otp, System.currentTimeMillis()));
        log.debug("OTP generated for email={}", email);
        return otp;
    }

    /**
     * Validates the OTP — checks both value match and TTL.
     *
     * @return true if valid, false if wrong or expired
     */
    public boolean verify(String email, String otp) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null) {
            log.debug("OTP verify: no entry found for email={}", email);
            return false;
        }
        if (System.currentTimeMillis() - entry.createdAt > TTL_MS) {
            store.remove(email.toLowerCase());
            log.debug("OTP verify: expired for email={}", email);
            return false;
        }
        boolean match = entry.otp.equals(otp);
        log.debug("OTP verify: email={}, match={}", email, match);
        return match;
    }

    /**
     * Clears the OTP after successful password reset.
     */
    public void clearOtp(String email) {
        store.remove(email.toLowerCase());
    }

    // ── Inner record ──────────────────────────────────────────────────────────
    private record OtpEntry(String otp, long createdAt) {}
}