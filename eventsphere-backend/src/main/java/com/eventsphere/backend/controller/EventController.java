package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.request.FeedbackRequest;
import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.EventService;
import com.eventsphere.backend.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Event controller.
 *
 * Endpoints:
 *   GET  /api/events                          → all events (optional ?status= filter)
 *   GET  /api/events/:eventId                 → full detail + programmes + feedbacks
 *   POST /api/events/:eventId/feedback        → submit feedback (ROLE_USER, completed only)
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService    eventService;
    private final FeedbackService feedbackService;

    /**
     * GET /api/events
     * GET /api/events?status=ongoing   → OngoingEventsPage
     * GET /api/events?status=upcoming  → UpcomingEventsPage
     * GET /api/events?status=completed → CompletedEventsPage
     *
     * List view: programmes = null (not loaded), feedbacks = null.
     * Category and type ARE included (cheap H2 lookup per event).
     */
    @GetMapping
    public ResponseEntity<ApiResponse> getEvents(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
                ApiResponse.success("Events fetched", eventService.getEvents(status)));
    }

    /**
     * GET /api/events/:eventId
     *
     * Detail view: approved programmes included, feedbacks included for completed events.
     * Each programme has real price and seatsLeft from H2 ProgrammeMeta.
     */
    @GetMapping("/{eventId}")
    public ResponseEntity<ApiResponse> getEvent(@PathVariable String eventId) {
        return ResponseEntity.ok(
                ApiResponse.success("Event fetched", eventService.getEventDetail(eventId)));
    }

    /**
     * POST /api/events/:eventId/feedback
     *
     * Requires ROLE_USER JWT (secured by SecurityConfig).
     * userId is extracted from JWT — never from request body.
     * Only works for completed events — FeedbackService enforces this.
     * One feedback per user per event — duplicate returns HTTP 409.
     *
     * Body: { "rating": 4, "comment": "Great event!" }
     */
    @PostMapping("/{eventId}/feedback")
    public ResponseEntity<ApiResponse> submitFeedback(
            @PathVariable String eventId,
            @Valid @RequestBody FeedbackRequest req,
            Authentication auth) {

        String userId = auth.getName(); // extracted from JWT by JwtAuthFilter

        return ResponseEntity.ok(
                ApiResponse.success("Feedback submitted successfully",
                        feedbackService.submitFeedback(eventId, userId, req)));
    }
}