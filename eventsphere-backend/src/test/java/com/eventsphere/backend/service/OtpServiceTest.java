package com.eventsphere.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link OtpService}.
 */
class OtpServiceTest {

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService();
    }

    @Test
    @DisplayName("generateAndStore() returns a 6-digit OTP")
    void generateAndStore_returnsOtp() {
        String otp = otpService.generateAndStore("test@test.com");

        assertNotNull(otp);
        assertEquals(6, otp.length());
        assertTrue(otp.matches("^\\d{6}$"));
    }

    @Test
    @DisplayName("verify() — correct OTP → returns true")
    void verify_correctOtp_returnsTrue() {
        String otp = otpService.generateAndStore("test@test.com");
        assertTrue(otpService.verify("test@test.com", otp));
    }

    @Test
    @DisplayName("verify() — wrong OTP → returns false")
    void verify_wrongOtp_returnsFalse() {
        otpService.generateAndStore("test@test.com");
        assertFalse(otpService.verify("test@test.com", "000000"));
    }

    @Test
    @DisplayName("verify() — no entry for email → returns false")
    void verify_noEntry_returnsFalse() {
        assertFalse(otpService.verify("nonexistent@test.com", "123456"));
    }

    @Test
    @DisplayName("clearOtp() removes the entry so verify returns false")
    void clearOtp_removesEntry() {
        String otp = otpService.generateAndStore("test@test.com");
        assertTrue(otpService.verify("test@test.com", otp));

        otpService.clearOtp("test@test.com");
        assertFalse(otpService.verify("test@test.com", otp));
    }

    @Test
    @DisplayName("Emails are case-insensitive")
    void verify_caseInsensitive() {
        String otp = otpService.generateAndStore("Test@Test.COM");
        assertTrue(otpService.verify("test@test.com", otp));
    }

    @Test
    @DisplayName("Second generateAndStore() overwrites previous OTP")
    void generateAndStore_overwritesPrevious() {
        String otp1 = otpService.generateAndStore("test@test.com");
        String otp2 = otpService.generateAndStore("test@test.com");

        assertFalse(otpService.verify("test@test.com", otp1),
                "Old OTP should no longer be valid if overwritten with a different value");
        assertTrue(otpService.verify("test@test.com", otp2));
    }
}
