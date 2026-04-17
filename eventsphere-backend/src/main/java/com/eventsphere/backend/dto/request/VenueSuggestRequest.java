package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for POST /api/venues/suggest
 *
 * Sent by the frontend when an organiser selects a programme category
 * in Step 2 of CreateEventPage. Spring Boot validates, calls the
 * Python ML service, and returns ranked venue suggestions.
 *
 * Fields map directly to ML model features:
 *   category      → Cultural | Technical | Sports | Ceremony | Food
 *   eventType     → Free | Paid  (from Step 1 form)
 *   eventMonth    → derived from eventStartDate in service layer
 *   dayOfWeek     → derived from eventStartDate in service layer
 *   durationHours → eventDuration from Step 1 form
 *
 * The frontend sends eventStartDate as a String (yyyy-MM-dd) and
 * durationHours as an integer. The service layer does the date math.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VenueSuggestRequest {

    /**
     * Programme category — must be one of the 5 types used during model training.
     * Matches EventMetadata.category taxonomy.
     */
    @NotBlank(message = "Category is required")
    @Pattern(
            regexp = "Cultural|Technical|Sports|Ceremony|Food",
            message = "Category must be one of: Cultural, Technical, Sports, Ceremony, Food"
    )
    private String category;

    /**
     * Whether the event is free or paid — from Step 1 of the form.
     */
    @NotBlank(message = "Event type is required")
    @Pattern(regexp = "Free|Paid", message = "Event type must be Free or Paid")
    private String eventType;

    /**
     * Event start date as a string (yyyy-MM-dd).
     * Service layer extracts month (1–12) and dayOfWeek (0=Mon … 6=Sun) from this.
     */
    @NotBlank(message = "Event start date is required")
    private String eventStartDate;

    /**
     * Total event duration in hours — from Step 1 of the form.
     */
    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 hour")
    @Max(value = 720, message = "Duration cannot exceed 720 hours")
    private Integer durationHours;
}