package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.response.AuthResponse;
import com.eventsphere.backend.entity.Admin;
import com.eventsphere.backend.exception.InvalidCredentialsException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.AdminRepository;
import com.eventsphere.backend.security.JwtUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;

/**
 * FaceAuthService — Admin Phase 2 authentication.
 *
 * Flow:
 *  1. Receive tempToken (from Phase 1) + capturedImageB64 (webcam frame).
 *  2. Validate tempToken — must be a valid, non-expired temp token.
 *  3. Extract adminId from tempToken.
 *  4. Load admin from Oracle — fetch ADMIN_BIOMETRIC BLOB bytes.
 *  5. Base64-encode the BLOB bytes → knownImageB64.
 *  6. POST { known_image_b64, captured_image_b64 } to Flask /verify.
 *  7. Flask returns { match, distance, threshold }.
 *  8. If match=true → issue real JWT → return AuthResponse.
 *  9. If match=false → throw InvalidCredentialsException (401).
 * 10. If Flask is unreachable → throw ServiceUnavailableException (503).
 *
 * Configuration:
 *   face.service.url = http://localhost:5001   (in application.properties)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FaceAuthService {

    private final AdminRepository adminRepository;
    private final JwtUtil         jwtUtil;
    private final ObjectMapper    objectMapper = new ObjectMapper();
    private final HttpClient      httpClient   = HttpClient.newHttpClient();

    @Value("${face.service.url:http://localhost:5001}")
    private String faceServiceUrl;

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Verifies the admin's face and, if successful, returns an AuthResponse
     * containing a real JWT with role="admin".
     *
     * @param tempToken        The Phase-1 temp token from Authorization header.
     * @param capturedImageB64 Base64-encoded JPEG from webcam (may include data-URL prefix).
     */
    public AuthResponse verifyFace(String tempToken, String capturedImageB64) {

        // ── 1. Validate temp token ─────────────────────────────────────────────
        if (!jwtUtil.isTokenValid(tempToken)) {
            throw new InvalidCredentialsException(
                    "Face verification session expired. Please log in again.");
        }
        if (!jwtUtil.isTempToken(tempToken)) {
            throw new InvalidCredentialsException(
                    "Invalid token for face verification.");
        }

        // ── 2. Extract adminId ─────────────────────────────────────────────────
        String adminId = jwtUtil.extractUserId(tempToken);

        // ── 3. Load admin + BLOB ───────────────────────────────────────────────
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Admin not found: " + adminId));

        byte[] biometricBytes = admin.getAdminBiometric();
        if (biometricBytes == null || biometricBytes.length == 0) {
            log.error("Admin {} has no biometric data in Oracle ADMIN_BIOMETRIC column.", adminId);
            throw new InvalidCredentialsException(
                    "Face authentication is not set up for this admin account. "
                            + "Contact your system administrator.");
        }

        // ── 4. Encode BLOB to base64 ───────────────────────────────────────────
        String knownImageB64 = Base64.getEncoder().encodeToString(biometricBytes);

        // ── 5. Call Flask /verify ──────────────────────────────────────────────
        JsonNode flaskResponse = callFaceService(knownImageB64, capturedImageB64);

        // ── 6. Evaluate result ─────────────────────────────────────────────────
        boolean match    = flaskResponse.path("match").asBoolean(false);
        double  distance = flaskResponse.path("distance").asDouble(1.0);
        String  reason   = flaskResponse.path("reason").asText("");

        log.info("Face verify for adminId={}: match={} distance={:.4f}",
                adminId, match, distance);

        if ("no_face_detected".equals(reason)) {
            throw new InvalidCredentialsException(
                    "No face detected in the captured image. "
                            + "Please ensure your face is clearly visible and try again.");
        }

        if (!match) {
            log.warn("Face verification FAILED for adminId={} — distance={:.4f}", adminId, distance);
            throw new InvalidCredentialsException(
                    "Face verification failed. The captured face does not match our records.");
        }

        // ── 7. Issue real JWT ──────────────────────────────────────────────────
        String realToken = jwtUtil.generateToken(adminId, "admin");
        String photoUrl  = "/photos/" + admin.getAdminFirstName() + ".jpg";

        log.info("Admin Face verification PASSED for adminId={} — issuing real JWT.", adminId);

        return AuthResponse.builder()
                .token(realToken)
                .tempToken(null)
                .role("admin")
                .userId(adminId)
                .name(admin.getAdminFirstName() + " " + admin.getAdminLastName())
                .email(admin.getAdminEmail())
                .photoUrl(photoUrl)
                .facePending(false)
                .build();
    }

    // ── Private: call Flask ────────────────────────────────────────────────────

    private JsonNode callFaceService(String knownImageB64, String capturedImageB64) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("known_image_b64",    knownImageB64);
            body.put("captured_image_b64", capturedImageB64);

            String requestBody = objectMapper.writeValueAsString(body);

            HttpRequest httpReq = HttpRequest.newBuilder()
                    .uri(URI.create(faceServiceUrl + "/verify"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> httpResp =
                    httpClient.send(httpReq, HttpResponse.BodyHandlers.ofString());

            if (httpResp.statusCode() == 422) {
                JsonNode err = objectMapper.readTree(httpResp.body());
                throw new InvalidCredentialsException(
                        err.path("error").asText("Face recognition setup error."));
            }

            if (httpResp.statusCode() != 200) {
                log.error("Flask /verify returned HTTP {}: {}", httpResp.statusCode(), httpResp.body());
                throw new RuntimeException("Face recognition service error.");
            }

            return objectMapper.readTree(httpResp.body());

        } catch (InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            log.error("Face recognition service unreachable at {}: {}", faceServiceUrl, e.getMessage());
            throw new RuntimeException(
                    "Face recognition service is currently unavailable. "
                            + "Please try again or contact your administrator.", e);
        }
    }
}