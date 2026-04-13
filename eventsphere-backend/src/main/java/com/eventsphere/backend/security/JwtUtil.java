package com.eventsphere.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT utility — generate, validate, and extract claims.
 *
 * Algorithm : HS256
 * Secret    : from application.properties (jwt.secret)
 * Expiry    : from application.properties (jwt.expiration) — default 86400000ms = 24h
 *
 * Token payload:
 *   sub  → userId  (e.g. "U-0001", "O-0001", "A-0001")
 *   role → "user" | "organiser" | "admin"
 *   iat  → issued-at
 *   exp  → expiry
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long      expirationMs;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMs) {
        this.key          = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // ── Generate ──────────────────────────────────────────────────────────────

    /**
     * Creates a signed JWT for the given userId and role.
     */
    public String generateToken(String userId, String role) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }

    // ── Extract ───────────────────────────────────────────────────────────────

    public String extractUserId(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) parseClaims(token).get("role");
    }

    // ── Validate ──────────────────────────────────────────────────────────────

    /**
     * Returns true if the token is structurally valid and not expired.
     */
    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}