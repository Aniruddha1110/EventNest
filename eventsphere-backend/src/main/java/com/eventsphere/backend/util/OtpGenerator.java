package com.eventsphere.backend.util;

import java.security.SecureRandom;

/**
 * Generates 6-digit OTP codes for forgot-password flow.
 *
 * Uses SecureRandom (cryptographically strong) not Random.
 * Output is always zero-padded to 6 digits, e.g. "047291".
 */
public final class OtpGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    private OtpGenerator() {}

    /**
     * Generates a 6-digit OTP as a zero-padded string.
     * Range: 000000 – 999999.
     */
    public static String generate() {
        int code = RANDOM.nextInt(1_000_000); // 0 to 999999
        return String.format("%06d", code);
    }
}