package com.eventsphere.backend.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Password hashing utility — locked in forever.
 *
 * Algorithm : SHA-256
 * Encoding  : UTF-8
 * Salt      : NONE
 * Output    : 64-character lowercase hexadecimal string
 *
 * Every password in Oracle (ADMINS, USERS, ORGANISERS) is stored
 * using exactly this method. NEVER change any of these three parameters
 * — doing so will invalidate every password already in the database.
 */
public final class PasswordUtil {

    private PasswordUtil() {}

    /**
     * Hashes a plain-text password using SHA-256 (UTF-8, no salt).
     *
     * @param plainText the raw password as typed by the user
     * @return 64-character lowercase hex string, e.g. "e7c42519d56f34f5..."
     */
    public static String hash(String plainText) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(
                    plainText.getBytes(StandardCharsets.UTF_8)
            );
            StringBuilder hex = new StringBuilder(64);
            for (byte b : hashBytes) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString(); // always exactly 64 chars
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available on this JVM", e);
        }
    }

    /**
     * Checks whether a plain-text input matches a stored hash.
     *
     * @param plainText     raw input from login form
     * @param storedHash    64-char hex from the database
     * @return true if they match
     */
    public static boolean matches(String plainText, String storedHash) {
        return hash(plainText).equals(storedHash);
    }
}