package com.eventsphere.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT authentication filter — runs once per request.
 *
 * Reads the Authorization header, strips "Bearer ", validates the JWT,
 * and populates SecurityContextHolder so Spring Security knows
 * who is making the request.
 *
 * Skipped automatically for public endpoints defined in SecurityConfig.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // No Bearer token → skip (public endpoint or missing auth, handled by SecurityConfig)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // strip "Bearer "

        if (!jwtUtil.isTokenValid(token)) {
            log.warn("Invalid or expired JWT on request to {}", request.getRequestURI());
            chain.doFilter(request, response);
            return;
        }

        String userId = jwtUtil.extractUserId(token);
        String role   = jwtUtil.extractRole(token);

        // Build Spring Security authority from JWT role claim
        // e.g. role="admin" → "ROLE_ADMIN"
        SimpleGrantedAuthority authority =
                new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(userId, null, List.of(authority));

        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(authToken);
        log.debug("JWT authenticated: userId={}, role={}", userId, role);

        chain.doFilter(request, response);
    }
}