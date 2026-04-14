package com.eventsphere.backend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link OtpGenerator}.
 */
class OtpGeneratorTest {

    @Test
    @DisplayName("generate() returns a 6-character string")
    void generate_returns6DigitString() {
        String otp = OtpGenerator.generate();
        assertNotNull(otp);
        assertEquals(6, otp.length());
    }

    @Test
    @DisplayName("generate() contains only digits")
    void generate_containsOnlyDigits() {
        for (int i = 0; i < 50; i++) {
            String otp = OtpGenerator.generate();
            assertTrue(otp.matches("^\\d{6}$"),
                    "OTP should be exactly 6 digits but was: " + otp);
        }
    }

    @Test
    @DisplayName("generate() produces varied results across multiple calls")
    void generate_producesVariedResults() {
        Set<String> otps = new HashSet<>();
        for (int i = 0; i < 20; i++) {
            otps.add(OtpGenerator.generate());
        }
        // With SecureRandom the probability of 20 identical 6-digit codes is negligible
        assertTrue(otps.size() > 1, "Expected varied OTPs, got only: " + otps);
    }

    @Test
    @DisplayName("generate() zero-pads small numbers (e.g. can produce '000xxx')")
    void generate_zeroPadsOutput() {
        // Run enough times to verify format is always 6 chars even for small numbers
        for (int i = 0; i < 100; i++) {
            String otp = OtpGenerator.generate();
            assertEquals(6, otp.length(),
                    "OTP must always be zero-padded to 6 digits");
        }
    }
}
