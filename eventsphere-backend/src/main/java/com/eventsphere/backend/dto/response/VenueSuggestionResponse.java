package com.eventsphere.backend.dto.response;

import lombok.*;
import java.util.List;

/**
 * Response DTO for POST /api/venues/suggest
 *
 * Wraps the top-3 suggested venues returned by the ML model,
 * along with the model's suitability score and rank for each.
 *
 * The frontend uses this to render the suggestion card inline
 * below the venue dropdown in Step 2 of CreateEventPage.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenueSuggestionResponse {

    /** The 3 (or fewer) venues ranked by suitability. */
    private List<SuggestedVenue> suggestions;

    /** The category used to produce this suggestion set. */
    private String category;

    /** Informational message — e.g. "Top 3 venues for Cultural events" */
    private String message;

    // ── Inner record for each suggested venue ─────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SuggestedVenue {

        private String  venueId;
        private String  venueName;
        private Integer venueCapacity;

        /**
         * ML suitability score (0.0 – 1.0).
         * Higher = better fit for the given event context.
         * Shown as a percentage bar in the frontend suggestion card.
         */
        private Double  suitabilityScore;

        /** 1-based rank (1 = best match). */
        private Integer rank;
    }
}