package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.request.ProgrammeStatusRequest;
import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.ProgrammeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Programme controller.
 *
 * Endpoints:
 *   GET    /api/programmes               → all programmes (optional ?status= filter)
 *   GET    /api/programmes/event/:id     → all programmes for a specific event
 *   PATCH  /api/programmes/:id/status   → admin approves or rejects (ROLE_ADMIN)
 *   DELETE /api/programmes/:id          → admin deletes (ROLE_ADMIN)
 */
@RestController
@RequestMapping("/api/programmes")
@RequiredArgsConstructor
public class ProgrammeController {

    private final ProgrammeService programmeService;

    /**
     * GET /api/programmes
     * GET /api/programmes?status=pending  → admin reviews pending list
     */
    @GetMapping
    public ResponseEntity<ApiResponse> getAll(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
                ApiResponse.success("Programmes fetched",
                        programmeService.getAllProgrammes(status)));
    }

    /**
     * GET /api/programmes/event/:eventId
     * Used by EventDetailPage to load the programme list for one event.
     */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<ApiResponse> getByEvent(@PathVariable String eventId) {
        return ResponseEntity.ok(
                ApiResponse.success("Programmes fetched",
                        programmeService.getProgrammesByEvent(eventId)));
    }

    /**
     * PATCH /api/programmes/:id/status
     * Admin only — body: { "status": "approved" | "rejected" | "cancelled" }
     * Triggers email notification to the organiser.
     */
    @PatchMapping("/{programmeId}/status")
    public ResponseEntity<ApiResponse> updateStatus(
            @PathVariable String programmeId,
            @Valid @RequestBody ProgrammeStatusRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success("Programme status updated",
                        programmeService.updateStatus(programmeId, req.getStatus())));
    }

    /**
     * DELETE /api/programmes/:id
     * Admin only.
     */
    @DeleteMapping("/{programmeId}")
    public ResponseEntity<ApiResponse> delete(@PathVariable String programmeId) {
        programmeService.deleteProgramme(programmeId);
        return ResponseEntity.ok(ApiResponse.success("Programme deleted"));
    }
}