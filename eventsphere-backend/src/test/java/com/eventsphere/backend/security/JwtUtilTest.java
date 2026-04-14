package com.eventsphere.backend.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link JwtUtil}.
 */
class JwtUtilTest {

    private static final String SECRET = "TestSecretKeyThatIsAtLeast256BitsLongForHS256Algorithm!!";
    private static final long   EXPIRATION_MS = 86_400_000L; // 24h

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(SECRET, EXPIRATION_MS);
    }

    @Test
    @DisplayName("generateToken() returns a non-blank JWT string")
    void generateToken_returnsNonBlankString() {
        String token = jwtUtil.generateToken("U-0001", "user");
        assertNotNull(token);
        assertFalse(token.isBlank());
        // JWT has 3 parts separated by '.'
        assertEquals(3, token.split("\\.").length);
    }

    @Test
    @DisplayName("extractUserId() returns the correct subject")
    void extractUserId_returnsCorrectId() {
        String token = jwtUtil.generateToken("U-0042", "user");
        assertEquals("U-0042", jwtUtil.extractUserId(token));
    }

    @Test
    @DisplayName("extractRole() returns the correct role claim")
    void extractRole_returnsCorrectRole() {
        String token = jwtUtil.generateToken("A-0001", "admin");
        assertEquals("admin", jwtUtil.extractRole(token));
    }

    @Test
    @DisplayName("isTokenValid() returns true for a freshly generated token")
    void isTokenValid_returnsTrueForValidToken() {
        String token = jwtUtil.generateToken("O-0001", "organiser");
        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    @DisplayName("isTokenValid() returns false for a tampered token")
    void isTokenValid_returnsFalseForTamperedToken() {
        String token = jwtUtil.generateToken("U-0001", "user");
        // Tamper by flipping a character
        String tampered = token.substring(0, token.length() - 5) + "XXXXX";
        assertFalse(jwtUtil.isTokenValid(tampered));
    }

    @Test
    @DisplayName("isTokenValid() returns false for an expired token")
    void isTokenValid_returnsFalseForExpiredToken() throws InterruptedException {
        // Create JwtUtil with 1ms expiry
        JwtUtil shortLived = new JwtUtil(SECRET, 1L);
        String token = shortLived.generateToken("U-0001", "user");
        Thread.sleep(50); // wait for token to expire
        assertFalse(shortLived.isTokenValid(token));
    }

    @Test
    @DisplayName("isTokenValid() returns false for null/empty/garbage input")
    void isTokenValid_returnsFalseForGarbageInput() {
        assertFalse(jwtUtil.isTokenValid(null));
        assertFalse(jwtUtil.isTokenValid(""));
        assertFalse(jwtUtil.isTokenValid("not.a.jwt"));
    }

    @Test
    @DisplayName("Tokens with different roles produce different role claims")
    void differentRoles_produceDifferentClaims() {
        String userToken   = jwtUtil.generateToken("U-0001", "user");
        String adminToken  = jwtUtil.generateToken("U-0001", "admin");
        assertEquals("user",  jwtUtil.extractRole(userToken));
        assertEquals("admin", jwtUtil.extractRole(adminToken));
    }
}
