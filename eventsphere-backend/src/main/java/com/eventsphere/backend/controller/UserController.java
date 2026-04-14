package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.OAuthUserService;
import com.eventsphere.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * User controller — serves GET /api/users/profile for BOTH user types:
 *
 *   U-XXXX  → regular password-based users (USERS table) → UserService
 *   OAU-XXXX → OAuth2 users (OAUTH_USERS table)          → OAuthUserService
 *
 * Both return the same UserResponse DTO so the frontend works
 * transparently regardless of which table the user came from.
 *
 * The userId is always extracted from the JWT via auth.getName()
 * which JwtAuthFilter sets to the 'sub' claim (U-0001 or OAU-0001).
 * A user can only ever read their own profile.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService      userService;
    private final OAuthUserService oauthUserService;

    /** GET /api/users/profile */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getProfile(Authentication auth) {
        String userId = auth.getName(); // e.g. "U-0001" or "OAU-0001"

        // Route based on ID prefix
        if (userId != null && userId.startsWith("OAU-")) {
            return ResponseEntity.ok(
                    ApiResponse.success("Profile fetched",
                            oauthUserService.getProfile(userId)));
        }

        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched",
                        userService.getProfile(userId)));
    }
}