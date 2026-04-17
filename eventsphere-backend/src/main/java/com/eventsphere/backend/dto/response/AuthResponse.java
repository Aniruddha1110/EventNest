package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Authentication response DTO.
 *
 * ── Two usage patterns ────────────────────────────────────────────────────────
 *
 * 1. User / Organiser login (one-phase):
 *      token    = real JWT (role = "user" | "organiser")
 *      tempToken = null
 *      facePending = false
 *      → Frontend saves token to localStorage and navigates to dashboard.
 *
 * 2. Admin login Phase 1 (password correct, face not yet verified):
 *      token    = null                ← NO real token yet
 *      tempToken = short-lived JWT    ← role = "admin_pending", TTL 3 min
 *      facePending = true
 *      → Frontend receives this, navigates to /face-auth, passes tempToken
 *        in the Authorization header of POST /api/auth/face-verify.
 *
 * 3. Admin login Phase 2 (face verified):
 *      token    = real JWT (role = "admin")
 *      tempToken = null
 *      facePending = false
 *      → Frontend saves token to localStorage and navigates to /admin.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    /** Real JWT — present only after full authentication completes. */
    private String token;

    /**
     * Temp JWT — present only after Phase 1 (password) passes for admin.
     * Short TTL (3 min). Frontend uses this to call /face-verify.
     * Never saved to localStorage as the session token.
     */
    private String tempToken;

    /** Role string: "user" | "organiser" | "admin" | "admin_pending" */
    private String role;

    private String userId;
    private String name;
    private String email;
    private String photoUrl;

    /**
     * True only when admin has passed Phase 1 but not yet Phase 2.
     * Frontend checks this flag to decide whether to show FaceAuthPage.
     */
    private boolean facePending;
}