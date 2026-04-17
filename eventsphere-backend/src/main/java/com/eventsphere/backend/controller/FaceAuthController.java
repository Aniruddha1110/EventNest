package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.FaceAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * FaceAuthController
 * ==================
 * Exposes the Admin Phase 2 face verification endpoint.
 *
 *   POST /api/auth/face-verify
 *
 * Security:
 *   - Requires Authorization: Bearer <tempToken>  (issued by Phase 1 loginAdmin)
 *   - The tempToken has role="admin_pending" — blocked on all other routes
 *   - This endpoint is the ONLY route that accepts admin_pending tokens
 *   - TTL of tempToken is 3 minutes — if expired, Phase 1 must be repeated
 *
 * Request body (multipart OR JSON):
 *   We use JSON with base64-encoded image for simplicity.
 *   The frontend sends the webcam JPEG frame as a base64 data-URL string.
 *
 *   {
 *     "capturedImageB64": "data:image/jpeg;base64,/9j/4AAQ..."
 *   }
 *
 * Response on success (200):
 *   ApiResponse wrapping AuthResponse {
 *     token: "<real JWT>",
 *     role:  "admin",
 *     facePending: false,
 *     ...
 *   }
 *
 * Response on failure (401):
 *   ApiResponse { success: false, message: "Face verification failed..." }
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class FaceAuthController {

    private final FaceAuthService faceAuthService;

    /**
     * Admin Phase 2 — face verification.
     *
     * The Authorization header must carry the temp token from Phase 1.
     * The body must contain the base64-encoded webcam capture.
     */
    @PostMapping("/face-verify")
    public ResponseEntity<ApiResponse> faceVerify(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody FaceVerifyRequest req) {

        // Extract Bearer token from Authorization header
        String tempToken = authHeader.startsWith("Bearer ")
                ? authHeader.substring(7)
                : authHeader;

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Face verification successful",
                        faceAuthService.verifyFace(tempToken, req.getCapturedImageB64())
                )
        );
    }

    // ── Inner request DTO (simple — no need for a separate file) ──────────────

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class FaceVerifyRequest {
        /**
         * Base64-encoded JPEG from webcam.
         * May include the data-URL prefix: "data:image/jpeg;base64,..."
         * Flask strips the prefix automatically.
         */
        private String capturedImageB64;
    }
}