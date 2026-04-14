package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Feedback item returned inside EventResponse.feedbacks list.
 *
 * Matches the frontend mockData.js feedback shape exactly:
 *   { user, rating, comment, date }
 *
 * "user" maps to userDisplay ("FirstName L." format).
 * "date" is formatted as ISO date string from submittedAt.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackResponse {

    /** Display name e.g. "Aniruddha D." */
    private String        user;

    /** Star rating 1–5. */
    private Integer       rating;

    /** Text comment. */
    private String        comment;

    /** Submission date as ISO string e.g. "2026-01-16". */
    private String        date;
}