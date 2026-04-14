package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * POST /api/events/:eventId/feedback
 *
 * Submitted by a logged-in user on a completed event.
 * userId is read from JWT (never from request body).
 *
 * rating  : 1–5 stars (required)
 * comment : text comment (optional, max 500 chars)
 */
@Data
public class FeedbackRequest {

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    private String comment;
}