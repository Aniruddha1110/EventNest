package com.eventsphere.backend.security;

import com.eventsphere.backend.entity.OAuthUser;
import com.eventsphere.backend.event.OAuthUserRegisteredEvent;
import com.eventsphere.backend.repository.OAuthUserRepository;
import com.eventsphere.backend.util.PasswordUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Handles the callback after successful Google or GitHub OAuth2 login.
 *
 * Key design decisions:
 *  - OAuth2 users are stored in OAUTH_USERS (separate table), never in USERS
 *  - Their IDs are OAU-0001, OAU-0002, ... (not U-XXXX)
 *  - JWT role is "user" — same as regular users, so all /api/users/** and
 *    /api/bank/** endpoints work transparently
 *  - Returning OAuth2 users: photo URL is refreshed on every login
 *  - New OAuth2 users: OAuthUserRegisteredEvent fires so DataLoader
 *    creates their H2 bank account immediately
 *
 * Flow:
 *   1. Detect provider (google / github) from OAuth2AuthenticationToken
 *   2. Extract email, name, photo from OAuth2 attributes
 *   3. Find existing OAuthUser by email OR create new one
 *   4. Generate JWT (sub = OAU-XXXX, role = user)
 *   5. Redirect to http://localhost:5173/oauth/callback?token=...&...
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String FRONTEND_CALLBACK = "http://localhost:5173/oauth2/redirect";

    private final OAuthUserRepository      oauthUserRepository;
    private final JwtUtil                  jwtUtil;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest  request,
                                        HttpServletResponse response,
                                        Authentication      authentication)
            throws IOException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauthUser = oauthToken.getPrincipal();
        String provider = oauthToken.getAuthorizedClientRegistrationId(); // "google" | "github"

        // ── Extract attributes ────────────────────────────────────────────────
        String email    = extractEmail(oauthUser, provider);
        String name     = extractName(oauthUser, provider);
        String photoUrl = extractPhoto(oauthUser, provider);

        if (email == null) {
            log.error("OAuth2 login failed: email not present. provider={}", provider);
            response.sendRedirect("http://localhost:5173/login?error=oauth_no_email");
            return;
        }

        // ── Find or create OAuthUser ──────────────────────────────────────────
        String finalName     = name;
        String finalPhotoUrl = photoUrl;

        OAuthUser user = oauthUserRepository.findByOauthEmailIgnoreCase(email)
                .map(existing -> refreshPhoto(existing, finalPhotoUrl))
                .orElseGet(() -> createOAuthUser(email, finalName, finalPhotoUrl, provider));

        // ── Generate JWT ──────────────────────────────────────────────────────
        // sub = OAU-0001, role = "user"  →  ROLE_USER in JwtAuthFilter
        String token    = jwtUtil.generateToken(user.getOauthUserId(), "user");
        String fullName = user.getOauthFirstName() + " " + user.getOauthLastName();
        String photo    = user.getOauthPhotoUrl() != null ? user.getOauthPhotoUrl() : "";

        log.info("OAuth2 login success: oauthUserId={}, provider={}", user.getOauthUserId(), provider);

        // ── Redirect to frontend OAuthCallbackPage ────────────────────────────
        String redirectUrl = FRONTEND_CALLBACK
                + "?token="    + token
                + "&userId="   + user.getOauthUserId()
                + "&role=user"
                + "&userName="     + URLEncoder.encode(fullName, StandardCharsets.UTF_8)
                + "&userEmail="    + URLEncoder.encode(email, StandardCharsets.UTF_8)
                + "&photoUrl=" + URLEncoder.encode(photo, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }

    // ── Attribute extractors ──────────────────────────────────────────────────

    private String extractEmail(OAuth2User user, String provider) {
        String email = user.getAttribute("email");
        if (email == null && "github".equals(provider)) {
            log.warn("GitHub OAuth2: email is null — user may have set email private");
        }
        return email;
    }

    private String extractName(OAuth2User user, String provider) {
        String name = user.getAttribute("name");
        if (name == null && "github".equals(provider)) {
            name = user.getAttribute("login"); // GitHub display name fallback
        }
        return name != null ? name : "OAuth User";
    }

    private String extractPhoto(OAuth2User user, String provider) {
        return switch (provider) {
            case "google" -> user.getAttribute("picture");    // Google attribute name
            case "github" -> user.getAttribute("avatar_url"); // GitHub attribute name
            default       -> null;
        };
    }

    // ── Refresh photo on returning user ───────────────────────────────────────

    private OAuthUser refreshPhoto(OAuthUser existing, String photoUrl) {
        if (photoUrl != null && !photoUrl.equals(existing.getOauthPhotoUrl())) {
            existing.setOauthPhotoUrl(photoUrl);
            oauthUserRepository.save(existing);
            log.info("OAuth2: refreshed photo for oauthUserId={}", existing.getOauthUserId());
        }
        return existing;
    }

    // ── Create brand-new OAuthUser ────────────────────────────────────────────

    private OAuthUser createOAuthUser(String email, String name, String photoUrl, String provider) {
        // Auto-generate unique username from email prefix
        String base     = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "");
        String username = base.length() > 28 ? base.substring(0, 28) : base;
        int    suffix   = 1;
        while (oauthUserRepository.existsByOauthUsername(username)) {
            String sfx = String.valueOf(suffix++);
            username   = base.substring(0, Math.min(base.length(), 30 - sfx.length())) + sfx;
        }

        // Split name into first / last (truncate to 25 chars each to fit DB column)
        String[] parts   = name.split(" ", 2);
        String firstName = parts[0].length() > 25 ? parts[0].substring(0, 25) : parts[0];
        String lastName  = parts.length > 1 ? parts[1] : "User";
        if (lastName.length() > 25) lastName = lastName.substring(0, 25);

        // Dummy password — SHA-256 of a random UUID; user never logs in with it
        String dummyHash = PasswordUtil.hash(UUID.randomUUID().toString());

        OAuthUser newUser = OAuthUser.builder()
                .oauthFirstName(firstName)
                .oauthLastName(lastName)
                .oauthEmail(email)
                .oauthUsername(username)
                .oauthDummyPw(dummyHash)
                .oauthProvider(provider)
                .oauthPhotoUrl(photoUrl)
                // oauthPhoneNo intentionally null — OAuth2 doesn't provide phone
                .build();

        OAuthUser saved = oauthUserRepository.save(newUser);
        log.info("OAuth2: created OAuthUser oauthUserId={}, provider={}", saved.getOauthUserId(), provider);

        // Fire event → DataLoader creates H2 bank account for this OAU-XXXX user
        eventPublisher.publishEvent(new OAuthUserRegisteredEvent(this, saved));

        return saved;
    }
}