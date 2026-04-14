package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Full event representation including programmes, feedbacks, type and category.
 *
 * All fields now match the frontend mockData.js event shape exactly:
 *
 *   id            → eventId
 *   name          → eventName
 *   startDate     → eventStartDate
 *   endDate       → eventEndDate
 *   time          → eventTime
 *   duration      → eventDuration
 *   description   → eventDescription
 *   status        → eventStatus
 *   type          → eventType       ("Free" | "Paid")      ← from H2 EventMetadata
 *   organiserName → derived from first programme's organiser name
 *   programmes    → list of ProgrammeResponse              ← approved only
 *   feedbacks     → list of FeedbackResponse               ← completed events only
 *
 * NEW fields added for Topic 3:
 *   category  → "Cultural" | "Technical" | "Sports" | "Ceremony" | "Food"
 *               Populated from H2 EventMetadata by EventService
 *
 *   feedbacks → List<FeedbackResponse>
 *               Populated from H2 EventFeedback by EventService
 *               null for upcoming/ongoing events
 *               empty list for completed events with no feedback
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {

    private String    eventId;
    private String    eventName;
    private LocalDate eventStartDate;
    private LocalDate eventEndDate;
    private String    eventTime;
    private Integer   eventDuration;
    private String    eventDescription;

    /** "upcoming" | "ongoing" | "completed" — from Oracle EVENTS */
    private String    eventStatus;

    /**
     * "Free" or "Paid" — from H2 EventMetadata.
     * Derived by MetadataSeeder on startup based on event name.
     * For new events created by organiser: defaults to "Free" until
     * admin manually changes it (future feature).
     */
    private String    eventType;

    /**
     * "Cultural" | "Technical" | "Sports" | "Ceremony" | "Food"
     * From H2 EventMetadata, classified by MetadataSeeder on startup.
     * Used by UserPage and OrganiserPage card chips.
     */
    private String    category;

    /**
     * Approved programmes for this event.
     * null on list-view queries (performance — don't load all programmes for every card).
     * Fully populated on detail-view queries (/api/events/:id).
     */
    private List<ProgrammeResponse> programmes;

    /**
     * User feedback for this event.
     * Only populated for completed events.
     * null for upcoming and ongoing events.
     * Sourced from H2 EventFeedback table.
     * Mock feedback seeded by DataLoader on startup so CompletedEventsPage
     * always shows ratings without needing real user submissions.
     */
    private List<FeedbackResponse> feedbacks;
}