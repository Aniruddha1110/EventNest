package com.eventsphere.backend.service;

import com.eventsphere.backend.dataloader.MetadataSeeder;
import com.eventsphere.backend.dto.response.EventResponse;
import com.eventsphere.backend.dto.response.FeedbackResponse;
import com.eventsphere.backend.dto.response.ProgrammeResponse;
import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.Programme;
import com.eventsphere.backend.entity.h2.EventMetadata;
import com.eventsphere.backend.entity.h2.ProgrammeMeta;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.EventRepository;
import com.eventsphere.backend.repository.ProgrammeRepository;
import com.eventsphere.backend.repository.h2.EventMetadataRepository;
import com.eventsphere.backend.repository.h2.EventFeedbackRepository;
import com.eventsphere.backend.repository.h2.ProgrammeMetaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    // Oracle repos
    private final EventRepository     eventRepository;
    private final ProgrammeRepository programmeRepository;

    // H2 repos
    private final EventMetadataRepository  eventMetadataRepository;
    private final ProgrammeMetaRepository  programmeMetaRepository;
    private final EventFeedbackRepository  feedbackRepository;

    // ── List (with optional status filter) ────────────────────────────────────

    public List<EventResponse> getEvents(String status) {
        String statusParam = (status != null && !status.isBlank()) ? status : null;
        List<Event> events = eventRepository.findAllWithDetails(statusParam);
        return events.stream().map(e -> toResponse(e, true)).toList();
    }

    // ── Detail (with programmes + feedback) ───────────────────────────────────

    public EventResponse getEventDetail(String eventId) {
        Event event = eventRepository.findByIdWithDetails(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        return toResponse(event, true);
    }

    // ── Admin: update event status ────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public EventResponse updateStatus(String eventId, String status) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        event.setEventStatus(status);
        eventRepository.save(event);
        log.info("Event status updated: eventId={}, status={}", eventId, status);
        return toResponse(event, false);
    }

    // ── Admin: delete event ───────────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public void deleteEvent(String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
        eventRepository.delete(event);
        log.info("Event deleted: eventId={}", eventId);
    }

    // ── Organiser: create event ───────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public EventResponse createEvent(Event event, String eventType, String category) {
        Event saved = eventRepository.save(event);
        log.info("Event created: eventId={}", saved.getEventId());

        // Insert H2 EventMetadata so the new event has type + category immediately.
        // Without this, toResponse() defaults to "Free" / "Cultural" regardless of input.
        EventMetadata meta = EventMetadata.builder()
                .eventId(saved.getEventId())
                .eventType(eventType != null ? eventType : "Free")
                .category(MetadataSeeder.classifyEvent(saved).getCategory())
                .build();
        eventMetadataRepository.save(meta);

        // Insert H2 ProgrammeMeta for every programme so price + seatsLeft work.
        if (saved.getProgrammes() != null) {
            int[] prices = {99, 199, 299, 499};
            int i = 0;
            for (Programme p : saved.getProgrammes()) {
                int price = "Paid".equals(eventType) ? prices[i % prices.length] : 0;
                programmeMetaRepository.save(
                        ProgrammeMeta.builder()
                                .programmeId(p.getProgrammeId())
                                .price(price)
                                .seatsBooked(0)
                                .build()
                );
                i++;
            }
        }

        return toResponse(saved, true);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    public EventResponse toResponse(Event event, boolean includeProgrammes) {

        // ── Pull metadata from H2 ─────────────────────────────────────────────
        EventMetadata meta = eventMetadataRepository
                .findByEventId(event.getEventId())
                .orElse(null);

        String eventType = (meta != null) ? meta.getEventType() : "Free";
        String category  = (meta != null) ? meta.getCategory()  : "Cultural";

        // ── Programmes ────────────────────────────────────────────────────────
        List<ProgrammeResponse> programmes = null;
        if (includeProgrammes && event.getProgrammes() != null) {
            programmes = event.getProgrammes().stream()
                    .filter(p -> "approved".equals(p.getProgrammeStatus()))
                    .map(p -> toProgrammeResponse(p, eventType))
                    .toList();
        }

        // ── Feedbacks (only for completed events) ─────────────────────────────
        List<FeedbackResponse> feedbacks = null;
        if ("completed".equals(event.getEventStatus())) {
            feedbacks = feedbackRepository
                    .findByEventIdOrderBySubmittedAtDesc(event.getEventId())
                    .stream()
                    .map(fb -> FeedbackResponse.builder()
                            .user(fb.getUserDisplay())
                            .rating(fb.getRating())
                            .comment(fb.getComment())
                            .date(fb.getSubmittedAt() != null
                                    ? fb.getSubmittedAt().toLocalDate().toString()
                                    : "")
                            .build())
                    .toList();
        }

        return EventResponse.builder()
                .eventId(event.getEventId())
                .eventName(event.getEventName())
                .eventStartDate(event.getEventStartDate())
                .eventEndDate(event.getEventEndDate())
                .eventTime(event.getEventTime())
                .eventDuration(event.getEventDuration())
                .eventDescription(event.getEventDescription())
                .eventStatus(event.getEventStatus())
                .eventType(eventType)
                .category(category)
                .programmes(programmes)
                .feedbacks(feedbacks)
                .build();
    }

    private ProgrammeResponse toProgrammeResponse(Programme p, String eventType) {

        // Pull price and seat data from H2 ProgrammeMeta
        ProgrammeMeta meta = programmeMetaRepository
                .findByProgrammeId(p.getProgrammeId())
                .orElse(null);

        int price       = (meta != null) ? meta.getPrice() : 0;
        int seatsBooked = (meta != null) ? meta.getSeatsBooked() : 0;
        int capacity    = (p.getVenue() != null && p.getVenue().getVenueCapacity() != null)
                ? p.getVenue().getVenueCapacity() : 0;
        int seatsLeft   = Math.max(0, capacity - seatsBooked);

        return ProgrammeResponse.builder()
                .programmeId(p.getProgrammeId())
                .programmeName(p.getProgrammeName())
                .programmeDescription(p.getProgrammeDescription())
                .programmeStatus(p.getProgrammeStatus())
                .eventId(p.getEvent()     != null ? p.getEvent().getEventId()         : null)
                .eventName(p.getEvent()   != null ? p.getEvent().getEventName()       : null)
                .organiserId(p.getOrganiser() != null ? p.getOrganiser().getOrganiserId()   : null)
                .organiserName(p.getOrganiser() != null ? p.getOrganiser().getOrganiserName() : null)
                .venueId(p.getVenue()     != null ? p.getVenue().getVenueId()         : null)
                .venueName(p.getVenue()   != null ? p.getVenue().getVenueName()       : null)
                .venueCapacity(capacity)
                .seatsLeft(seatsLeft)
                .price(price)
                .build();
    }
}