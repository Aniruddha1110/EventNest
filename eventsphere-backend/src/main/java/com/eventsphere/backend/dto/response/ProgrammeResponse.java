package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgrammeResponse {

    private String  programmeId;
    private String  programmeName;
    private String  programmeDescription;
    private String  programmeStatus;

    // ── Event info (parent) ───────────────────────────────────────────────────
    private String  eventId;
    private String  eventName;

    // ── Organiser info (denormalised) ─────────────────────────────────────────
    private String  organiserId;
    private String  organiserName;

    // ── Venue info (denormalised) ─────────────────────────────────────────────
    private String  venueId;
    private String  venueName;
    private Integer venueCapacity;

    /**
     * Seats remaining. Calculated at service layer.
     * Displayed as the seat fill progress bar on EventDetailPage.
     */
    private Integer seatsLeft;

    /**
     * Ticket price in INR.
     * 0 for free events/programmes.
     * Will come from a PRICE column once added to PROGRAMMES table.
     */
    private Integer price;
}