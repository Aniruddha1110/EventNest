package com.eventsphere.backend.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link PasswordUtil}.
 * Verifies SHA-256 hashing with UTF-8, no salt, 64-char hex output.
 */
class PasswordUtilTest {

    @Test
    @DisplayName("hash() returns a 64-character lowercase hex string")
    void hash_returnsSha256HexString() {
        String hash = PasswordUtil.hash("anything");
        assertNotNull(hash);
        assertEquals(64, hash.length());
        assertTrue(hash.matches("^[0-9a-f]{64}$"), "Hash must be lowercase hex");
    }

    @Test
    @DisplayName("hash() matches known SHA-256 of 'password123'")
    void hash_matchesKnownSha256() {
        // SHA-256("password123") = ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
        String expected = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f";
        assertEquals(expected, PasswordUtil.hash("password123"));
    }

    @Test
    @DisplayName("matches() returns true for correct password")
    void matches_returnsTrueForCorrectPassword() {
        String plain = "mySecretPassword";
        String hash = PasswordUtil.hash(plain);
        assertTrue(PasswordUtil.matches(plain, hash));
    }

    @Test
    @DisplayName("matches() returns false for wrong password")
    void matches_returnsFalseForWrongPassword() {
        String hash = PasswordUtil.hash("correctPassword");
        assertFalse(PasswordUtil.matches("wrongPassword", hash));
    }

    @Test
    @DisplayName("hash() is consistent across multiple calls")
    void hash_isConsistentAcrossMultipleCalls() {
        String input = "repeatMe";
        String hash1 = PasswordUtil.hash(input);
        String hash2 = PasswordUtil.hash(input);
        String hash3 = PasswordUtil.hash(input);
        assertEquals(hash1, hash2);
        assertEquals(hash2, hash3);
    }

    @Test
    @DisplayName("hash() produces different outputs for different inputs")
    void hash_differentInputsProduceDifferentHashes() {
        assertNotEquals(PasswordUtil.hash("password1"), PasswordUtil.hash("password2"));
    }

    @Test
    @DisplayName("hash() handles empty string input")
    void hash_handlesEmptyString() {
        // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
        String expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
        assertEquals(expected, PasswordUtil.hash(""));
    }
}
