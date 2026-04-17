package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.request.VenueSuggestRequest;
import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.VenueSuggestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * VenueSuggestController
 * ======================
 * Exposes the ML-powered venue suggestion endpoint.
 *
 *   POST /api/venues/suggest
 *
 * Called by the frontend (CreateEventPage) automatically when the
 * organiser selects a programme category in Step 2.
 *
 * No admin role required — any authenticated organiser can call this.
 * (Add @PreAuthorize("hasRole('ORGANISER')") if you want to restrict it.)
 *
 * Note: This is intentionally a separate controller from VenueController
 * (/api/admin/venues) to keep admin CRUD operations isolated from the
 * ML suggestion feature.
 */
@RestController
@RequestMapping("/api/venues")
@RequiredArgsConstructor
public class VenueSuggestController {

    private final VenueSuggestionService venueSuggestionService;

    /**
     * Suggest top-3 venues for a given programme category + event context.
     *
     * Request:  VenueSuggestRequest  (category, eventType, eventStartDate, durationHours)
     * Response: ApiResponse wrapping VenueSuggestionResponse (suggestions list)
     */
    @PostMapping("/suggest")
    public ResponseEntity<ApiResponse> suggest(@Valid @RequestBody VenueSuggestRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "Venue suggestions generated",
                        venueSuggestionService.suggest(req)
                )
        );
    }
}