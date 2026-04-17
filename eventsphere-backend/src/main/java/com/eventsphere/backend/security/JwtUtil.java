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
 * ── Two token types ───────────────────────────────────────────────────────────
 *
 * 1. REAL TOKEN  (role = "admin" | "user" | "organiser")
 *    Generated after full authentication is complete.
 *    Grants access to all protected routes.
 *    Payload: { sub: adminId, role: "admin", face_pending: false }
 *
 * 2. TEMP TOKEN  (role = "admin_pending")
 *    Generated after Phase 1 (password) passes, before Phase 2 (face).
 *    Grants access ONLY to POST /api/auth/face-verify.
 *    The security filter rejects this token for every other admin route.
 *    Short TTL: 3 minutes — enough time to complete face scan.
 *    Payload: { sub: adminId, role: "admin_pending", face_pending: true }
 *
 * Why a temp token instead of just passing adminId in the body?
 *   The temp token is signed — it can't be forged or tampered with.
 *   The frontend receives it and sends it as Authorization: Bearer <tempToken>
 *   to /face-verify, proving Phase 1 was genuinely passed.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long      expirationMs;

    /** 3 minutes for temp token — enough time to complete face scan */
    private static final long TEMP_TOKEN_TTL_MS = 3 * 60 * 1000L;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMs) {
        this.key          = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    // ── Generate real token ────────────────────────────────────────────────────

    /**
     * Creates a signed JWT for the given userId and role.
     * This is the token saved to localStorage and used for dashboard access.
     */
    public String generateToken(String userId, String role) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .claim("face_pending", false)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(key)
                .compact();
    }

    // ── Generate temp token (Phase 1 passed, face not yet verified) ───────────

    /**
     * Creates a short-lived signed JWT issued after password verification passes.
     * role = "admin_pending" — blocked by security filter on all admin routes.
     * Only accepted by POST /api/auth/face-verify.
     * TTL: 3 minutes.
     */
    public String generateTempToken(String adminId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(adminId)
                .claim("role", "admin_pending")
                .claim("face_pending", true)
                .issuedAt(new Date(now))
                .expiration(new Date(now + TEMP_TOKEN_TTL_MS))
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

    /**
     * Returns true if this is a Phase-1 temp token (face_pending = true).
     * Used by FaceAuthService to verify the caller genuinely passed Phase 1.
     */
    public boolean isTempToken(String token) {
        try {
            Claims claims = parseClaims(token);
            Object pending = claims.get("face_pending");
            return Boolean.TRUE.equals(pending)
                    && "admin_pending".equals(claims.get("role"));
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