package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.Organiser;
import com.eventsphere.backend.entity.Programme;
import com.eventsphere.backend.entity.Venue;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.OrganiserRepository;
import com.eventsphere.backend.repository.VenueRepository;
import com.eventsphere.backend.service.EventService;
import com.eventsphere.backend.service.OrganiserService;
import com.eventsphere.backend.service.ProgrammeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Organiser controller.
 *
 * All endpoints require ROLE_ORGANISER JWT.
 * The organiserId is always taken from the JWT (auth.getName()), never from
 * a request body — an organiser can only operate on their own data.
 *
 * Endpoints:
 *   GET  /api/organisers/profile    → own profile
 *   GET  /api/organisers/events     → all events created by this organiser
 *   POST /api/organisers/events     → create a new event with programmes
 *   GET  /api/organisers/programmes → all programmes submitted by this organiser
 */
@RestController
@RequestMapping("/api/organisers")
@RequiredArgsConstructor
public class OrganiserController {

    private final OrganiserService    organiserService;
    private final EventService        eventService;
    private final ProgrammeService    programmeService;
    private final OrganiserRepository organiserRepository;
    private final VenueRepository     venueRepository;

    /** GET /api/organisers/profile */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getProfile(Authentication auth) {
        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched", organiserService.getProfile(auth.getName())));
    }

    /** GET /api/organisers/events */
    @GetMapping("/events")
    public ResponseEntity<ApiResponse> getMyEvents(Authentication auth) {
        // Return all events where any programme has this organiser
        List<?> programmes = programmeService.getProgrammesByOrganiser(auth.getName());
        return ResponseEntity.ok(ApiResponse.success("Events fetched", programmes));
    }

    /**
     * POST /api/organisers/events
     *
     * Creates an Event + one-or-more Programmes in one request.
     *
     * Expected body (mirrors CreateEventPage.jsx payload):
     * {
     *   "eventName": "KIIT Fest 2026",
     *   "eventStartDate": "2026-04-10",
     *   "eventEndDate":   "2026-04-12",
     *   "eventTime":      "18:00",
     *   "eventDuration":  4,
     *   "eventDescription": "...",
     *   "organiserId": "O-0001",       ← auto-set on frontend from profile fetch
     *   "programmes": [
     *     { "programmeName": "Cultural Night", "venueId": "V-0001", "programmeDescription": "..." },
     *     { "programmeName": "DJ Night",       "venueId": "V-0002", "programmeDescription": "..." }
     *   ]
     * }
     *
     * All programmes start with status = "pending" regardless of what is sent.
     */
    @PostMapping("/events")
    public ResponseEntity<ApiResponse> createEvent(
            @RequestBody Map<String, Object> body,
            Authentication auth) {

        String organiserId = auth.getName(); // always from JWT, never from body

        Organiser organiser = organiserRepository.findById(organiserId)
                .orElseThrow(() -> new ResourceNotFoundException("Organiser not found: " + organiserId));

        // Build Event entity
        Event event = Event.builder()
                .eventName((String) body.get("eventName"))
                .eventStartDate(LocalDate.parse((String) body.get("eventStartDate")))
                .eventEndDate(LocalDate.parse((String) body.get("eventEndDate")))
                .eventTime((String) body.get("eventTime"))
                .eventDuration(((Number) body.get("eventDuration")).intValue())
                .eventDescription((String) body.getOrDefault("eventDescription", ""))
                .eventStatus("upcoming") // always starts as upcoming
                .build();

        // Build Programme entities from the array
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> progList =
                (List<Map<String, Object>>) body.getOrDefault("programmes", List.of());

        List<Programme> programmes = progList.stream().map(p -> {
            String venueId = (String) p.get("venueId");
            Venue venue = venueRepository.findById(venueId)
                    .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));
            return Programme.builder()
                    .programmeName((String) p.get("programmeName"))
                    .programmeDescription((String) p.getOrDefault("programmeDescription", ""))
                    .event(event)
                    .organiser(organiser)
                    .venue(venue)
                    .programmeStatus("pending") // always pending, admin approves
                    .build();
        }).toList();

        event.setProgrammes(programmes);

        String eventType = (String) body.getOrDefault("eventType", "Free");
        return ResponseEntity.ok(
                ApiResponse.success("Event submitted for review",
                        eventService.createEvent(event, eventType, null)));
    }

    /** GET /api/organisers/programmes */
    @GetMapping("/programmes")
    public ResponseEntity<ApiResponse> getMyProgrammes(Authentication auth) {
        return ResponseEntity.ok(
                ApiResponse.success("Programmes fetched",
                        programmeService.getProgrammesByOrganiser(auth.getName())));
    }
}