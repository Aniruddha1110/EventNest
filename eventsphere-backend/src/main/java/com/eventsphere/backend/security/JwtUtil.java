package com.eventsphere.backend;

import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // Generates a highly secure key automatically (Using JJWT 0.12.x syntax)
    private final SecretKey key = Jwts.SIG.HS256.key().build();

    // Set token to expire in 24 hours (in milliseconds)
    private final long EXPIRATION_TIME = 86400000;

    public String generateToken(String email, String role) {
        return Jwts.builder()
                .subject(email)              // Who the token belongs to
                .claim("role", role)         // Embed the role (e.g., USER, ADMIN)
                .issuedAt(new Date())        // Time it was created
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME)) // Expiration
                .signWith(key)               // Sign it cryptographically
                .compact();                  // Build the final string
    }
}