package com.eventsphere.backend.config;

import com.eventsphere.backend.security.JwtAuthFilter;
import com.eventsphere.backend.security.OAuth2SuccessHandler;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.annotation.WebServlet;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.h2.server.web.JakartaWebServlet;

import java.util.List;

/**
 * Spring Security configuration.
 *
 * Auth strategy : Stateless JWT — no sessions, no cookies.
 * Password enc  : NoOpPasswordEncoder because we manage hashing ourselves
 *                 in PasswordUtil (SHA-256 UTF-8 no salt). Spring Security
 *                 must not re-hash passwords already stored as SHA-256 hex.
 * CORS          : Allows http://localhost:5173 (Vite frontend).
 *
 * Public endpoints (no JWT needed):
 *   /api/auth/**          → login, register, forgot-password, verify-otp, reset-password
 *   /oauth2/**            → Google/GitHub redirect URLs
 *   /login/oauth2/**      → OAuth2 callback handling
 *   /h2-console/**        → H2 browser console (dev only)
 *   /api-docs/**          → Swagger JSON
 *   /swagger-ui/**        → Swagger UI
 *   /photos/**            → Admin biometric photos served as public images
 *   /actuator/health      → Health check
 *
 * Protected endpoints:
 *   ROLE_ADMIN     → /api/admin/**
 *   ROLE_ORGANISER → /api/organisers/**
 *   ROLE_USER      → /api/users/**, /api/bank/**
 *   Any JWT role   → /api/events/**, /api/venues/**
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter      jwtAuthFilter;
    private final OAuth2SuccessHandler oauth2SuccessHandler;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF — stateless JWT API, no cookie session
                .csrf(csrf -> csrf.
                        ignoringRequestMatchers("/h2-console/**")
                        .disable())

                // CORS — allow Vite frontend
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Stateless — no HTTP session
                .sessionManagement(sm ->
                        sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Allow H2 console frames (dev only — remove in production)
                .headers(h -> h.frameOptions(fo -> fo.sameOrigin()))

                // Endpoint authorisation rules
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(
                                DispatcherType.FORWARD,
                                DispatcherType.INCLUDE
                        ).permitAll()
                        // Fully public
                        .requestMatchers(
                                "/api/auth/**",
                                "/oauth2/**",
                                "/login/oauth2/**",
                                "/h2-console/**",
                                "/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/photos/**",
                                "/actuator/health"
                        ).permitAll()

                        // Role-locked endpoints
                        .requestMatchers("/api/admin/**",  "/api/mail/**").hasRole("ADMIN")
                        .requestMatchers("/api/organisers/**").hasAnyRole("ORGANISER", "ADMIN")
                        .requestMatchers("/api/users/**",  "/api/bank/**").hasAnyRole("USER", "ADMIN")

                        // Events and venues — any authenticated role
                        .requestMatchers("/api/events/**", "/api/venues/**", "/api/programmes/**")
                        .authenticated()

                        // Everything else requires auth
                        .anyRequest().authenticated()
                )

                // OAuth2 login configuration
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oauth2SuccessHandler)
                )

                // JWT filter runs before Spring's own UsernamePasswordAuthenticationFilter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * NoOpPasswordEncoder because PasswordUtil handles SHA-256 hashing manually.
     * Spring Security must not re-encode our already-hashed passwords.
     */
    @Bean
    @SuppressWarnings("deprecation")
    public PasswordEncoder passwordEncoder() {
        return NoOpPasswordEncoder.getInstance();
    }

    /**
     * CORS — allow all origins from localhost:5173 (Vite dev server).
     * In production, replace with your actual deployed frontend domain.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of("http://localhost:5173"));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }

    /**
     * Manually registers the H2 console servlet because Spring Boot's
     * H2 console auto-config only fires for the primary datasource.
     * Since our H2 is the secondary (bank.datasource), we register it here.
     */
    @Bean
    public ServletRegistrationBean<JakartaWebServlet> h2ConsoleServlet() {
        ServletRegistrationBean<JakartaWebServlet> bean =
                new ServletRegistrationBean<>(new JakartaWebServlet(), "/h2-console/*");
        bean.addInitParameter("webAllowOthers", "false");
        bean.addInitParameter("trace", "false");
        bean.setLoadOnStartup(1);
        return bean;
    }
}