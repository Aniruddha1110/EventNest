package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.request.*;
import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Admin controller — full system management.
 *
 * All endpoints require ROLE_ADMIN JWT (enforced by SecurityConfig).
 *
 * ── Admin management ──────────────────────────────
 *   GET    /api/admin/profile         → own profile
 *   GET    /api/admin/all             → all admins
 *   POST   /api/admin/add             → add new admin
 *   DELETE /api/admin/remove/:id      → remove admin (A-0001/2/3 blocked)
 *
 * ── User management ───────────────────────────────
 *   GET    /api/admin/users           → all users
 *   DELETE /api/admin/users/:id       → delete user
 *
 * ── Organiser management ──────────────────────────
 *   GET    /api/admin/organisers      → all organisers
 *   POST   /api/admin/organisers      → admin adds organiser directly
 *   DELETE /api/admin/organisers/:id  → remove organiser
 *
 * ── Event management ──────────────────────────────
 *   GET    /api/admin/events          → all events
 *   PATCH  /api/admin/events/:id/status → change event status
 *   DELETE /api/admin/events/:id      → delete event
 *
 * ── Programme management ──────────────────────────
 *   GET    /api/admin/programmes         → all programmes (?status=pending filter)
 *   PATCH  /api/admin/programmes/:id/status → approve/reject
 *   DELETE /api/admin/programmes/:id     → delete
 *
 * ── Photos ────────────────────────────────────────
 *   GET    /photos/:filename             → serve admin BLOB photo (public)
 */
@RestController
@RequiredArgsConstructor
public class AdminController {

    private final AdminService     adminService;
    private final UserService      userService;
    private final OrganiserService organiserService;
    private final EventService     eventService;
    private final ProgrammeService programmeService;

    // ── Admin management ──────────────────────────────────────────────────────

    @GetMapping("/api/admin/profile")
    public ResponseEntity<ApiResponse> getProfile(Authentication auth) {
        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched", adminService.getProfile(auth.getName())));
    }

    @GetMapping("/api/admin/all")
    public ResponseEntity<ApiResponse> getAllAdmins() {
        return ResponseEntity.ok(
                ApiResponse.success("Admins fetched", adminService.getAllAdmins()));
    }

    @PostMapping("/api/admin/add")
    public ResponseEntity<ApiResponse> addAdmin(@Valid @RequestBody AddAdminRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("Admin added", adminService.addAdmin(req)));
    }

    @DeleteMapping("/api/admin/remove/{adminId}")
    public ResponseEntity<ApiResponse> removeAdmin(@PathVariable String adminId) {
        adminService.removeAdmin(adminId);
        return ResponseEntity.ok(ApiResponse.success("Admin removed"));
    }

    @PutMapping("/api/admin/admins/{adminId}")
    public ResponseEntity<ApiResponse> updateAdmin(
            @PathVariable String adminId,
            @RequestBody AddAdminRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("Admin updated", adminService.updateAdmin(adminId, req)));
    }

    // ── User management ───────────────────────────────────────────────────────

    @GetMapping("/api/admin/users")
    public ResponseEntity<ApiResponse> getAllUsers() {
        return ResponseEntity.ok(
                ApiResponse.success("Users fetched", userService.getAllUsers()));
    }

    @DeleteMapping("/api/admin/users/{userId}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User deleted"));
    }

    @PutMapping("/api/admin/users/{userId}")
    public ResponseEntity<ApiResponse> updateUser(
            @PathVariable String userId,
            @RequestBody UpdateUserRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("User updated", userService.updateUser(userId, req)));
    }

    // ── Organiser management ──────────────────────────────────────────────────

    @GetMapping("/api/admin/organisers")
    public ResponseEntity<ApiResponse> getAllOrganisers() {
        return ResponseEntity.ok(
                ApiResponse.success("Organisers fetched", organiserService.getAllOrganisers()));
    }

    @PostMapping("/api/admin/organisers")
    public ResponseEntity<ApiResponse> addOrganiser(@Valid @RequestBody AddOrganiserRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("Organiser added", organiserService.addOrganiser(req)));
    }

    @DeleteMapping("/api/admin/organisers/{organiserId}")
    public ResponseEntity<ApiResponse> deleteOrganiser(@PathVariable String organiserId) {
        organiserService.deleteOrganiser(organiserId);
        return ResponseEntity.ok(ApiResponse.success("Organiser deleted"));
    }

    @PutMapping("/api/admin/organisers/{organiserId}")
    public ResponseEntity<ApiResponse> updateOrganiser(
            @PathVariable String organiserId,
            @RequestBody UpdateOrganiserRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("Organiser updated", organiserService.updateOrganiser(organiserId, req)));
    }

    // ── Event management ──────────────────────────────────────────────────────

    @GetMapping("/api/admin/events")
    public ResponseEntity<ApiResponse> getAllEvents() {
        return ResponseEntity.ok(
                ApiResponse.success("Events fetched", eventService.getEvents(null)));
    }

    @PatchMapping("/api/admin/events/{eventId}/status")
    public ResponseEntity<ApiResponse> updateEventStatus(
            @PathVariable String eventId,
            @Valid @RequestBody EventStatusRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("Event status updated",
                        eventService.updateStatus(eventId, req.getStatus())));
    }

    @DeleteMapping("/api/admin/events/{eventId}")
    public ResponseEntity<ApiResponse> deleteEvent(@PathVariable String eventId) {
        eventService.deleteEvent(eventId);
        return ResponseEntity.ok(ApiResponse.success("Event deleted"));
    }

    // ── Programme management ──────────────────────────────────────────────────

    @GetMapping("/api/admin/programmes")
    public ResponseEntity<ApiResponse> getAllProgrammes(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
                ApiResponse.success("Programmes fetched",
                        programmeService.getAllProgrammes(status)));
    }

    @PatchMapping("/api/admin/programmes/{programmeId}/status")
    public ResponseEntity<ApiResponse> updateProgrammeStatus(
            @PathVariable String programmeId,
            @Valid @RequestBody ProgrammeStatusRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("Programme status updated",
                        programmeService.updateStatus(programmeId, req.getStatus())));
    }

    @DeleteMapping("/api/admin/programmes/{programmeId}")
    public ResponseEntity<ApiResponse> deleteProgramme(@PathVariable String programmeId) {
        programmeService.deleteProgramme(programmeId);
        return ResponseEntity.ok(ApiResponse.success("Programme deleted"));
    }

    // ── Admin biometric photo — public endpoint ───────────────────────────────

    /**
     * GET /photos/:filename
     *
     * Serves admin BLOB photo bytes as image/jpeg.
     * Mapped here to keep all admin photo logic in one place.
     * SecurityConfig marks /photos/** as permitAll() — public endpoint.
     *
     * The filename is the admin's first name + extension e.g. "Aniruddha.jpg".
     * AdminService toResponse() builds the photoUrl using this pattern.
     *
     * Reads the BLOB from Oracle ADMINS table and streams it as image bytes.
     * Returns 404 if no photo is stored.
     */
    @GetMapping("/photos/{filename}")
    public ResponseEntity<ByteArrayResource> servePhoto(
            @PathVariable String filename) {

        // Extract first name from filename (strip extension)
        String firstName = filename.contains(".")
                ? filename.substring(0, filename.lastIndexOf('.'))
                : filename;

        // Find the admin by first name and read the biometric BLOB
        return adminService.getAllAdmins().stream()
                .filter(a -> a.getAdminFirstName().equalsIgnoreCase(firstName))
                .findFirst()
                .map(adminResp -> {
                    // Re-fetch with BLOB via service — AdminService.getProfileWithPhoto()
                    // For now, delegate to AdminService photo retrieval
                    byte[] photo = adminService.getAdminPhoto(adminResp.getAdminId());
                    if (photo == null || photo.length == 0) {
                        return ResponseEntity.notFound().<ByteArrayResource>build();
                    }
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION,
                                    "inline; filename=\"" + filename + "\"")
                            .contentType(MediaType.IMAGE_JPEG)
                            .body(new ByteArrayResource(photo));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}