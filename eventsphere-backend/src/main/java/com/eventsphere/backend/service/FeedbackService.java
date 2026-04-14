package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.FeedbackRequest;
import com.eventsphere.backend.dto.response.FeedbackResponse;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.entity.h2.EventFeedback;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.EventRepository;
import com.eventsphere.backend.repository.UserRepository;
import com.eventsphere.backend.repository.h2.EventFeedbackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Feedback service — manages user feedback for completed events in H2.
 *
 * Feedback is stored in H2 EVENT_FEEDBACK table.
 * On startup, DataLoader seeds mock feedback for all completed events.
 * Real feedback submitted during a session is stored until restart.
 *
 * Rules:
 *   - Only ROLE_USER can submit feedback (enforced in EventController)
 *   - Only one feedback per user per event (UNIQUE constraint + service check)
 *   - Feedback can only be submitted for completed events (enforced here)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final EventFeedbackRepository feedbackRepository;
    private final EventRepository         eventRepository;
    private final UserRepository          userRepository;

    // ── Get feedbacks for an event ────────────────────────────────────────────

    /**
     * Returns all feedbacks for an event ordered by newest first.
     * Called by EventService when building EventResponse.
     */
    public List<FeedbackResponse> getFeedbacksForEvent(String eventId) {
        return feedbackRepository.findByEventIdOrderBySubmittedAtDesc(eventId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Submit feedback ───────────────────────────────────────────────────────

    @Transactional("h2TransactionManager")
    public FeedbackResponse submitFeedback(String eventId, String userId, FeedbackRequest req) {

        // Guard: event must exist in Oracle
        var event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        // Guard: feedback only allowed on completed events
        if (!"completed".equals(event.getEventStatus())) {
            throw new IllegalStateException(
                    "Feedback can only be submitted for completed events. " +
                            "This event is currently: " + event.getEventStatus());
        }

        // Guard: one feedback per user per event
        if (feedbackRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new DuplicateResourceException(
                    "You have already submitted feedback for this event.");
        }

        // Fetch user display name from Oracle
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        String displayName = user.getUserFirstName() + " "
                + user.getUserLastName().charAt(0) + ".";

        EventFeedback feedback = EventFeedback.builder()
                .eventId(eventId)
                .userId(userId)
                .userDisplay(displayName)
                .rating(req.getRating())
                .comment(req.getComment() != null ? req.getComment() : "")
                .build();

        EventFeedback saved = feedbackRepository.save(feedback);
        log.info("Feedback submitted: eventId={}, userId={}, rating={}", eventId, userId, req.getRating());
        return toResponse(saved);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    public FeedbackResponse toResponse(EventFeedback fb) {
        String date = fb.getSubmittedAt() != null
                ? fb.getSubmittedAt().toLocalDate().toString()
                : "";
        return FeedbackResponse.builder()
                .user(fb.getUserDisplay())
                .rating(fb.getRating())
                .comment(fb.getComment())
                .date(date)
                .build();
    }
}