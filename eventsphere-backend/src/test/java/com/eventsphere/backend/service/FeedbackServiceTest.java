package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.FeedbackRequest;
import com.eventsphere.backend.dto.response.FeedbackResponse;
import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.entity.h2.EventFeedback;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.EventRepository;
import com.eventsphere.backend.repository.UserRepository;
import com.eventsphere.backend.repository.h2.EventFeedbackRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link FeedbackService}.
 */
@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock private EventFeedbackRepository feedbackRepository;
    @Mock private EventRepository         eventRepository;
    @Mock private UserRepository          userRepository;

    @InjectMocks
    private FeedbackService feedbackService;

    private Event buildCompletedEvent() {
        return Event.builder()
                .eventId("E-001")
                .eventName("Completed Fest")
                .eventStatus("completed")
                .build();
    }

    private User buildUser() {
        return User.builder()
                .userId("U-0001")
                .userFirstName("John")
                .userLastName("Doe")
                .build();
    }

    @Test
    @DisplayName("submitFeedback() — success")
    void submitFeedback_success() {
        FeedbackRequest req = new FeedbackRequest();
        req.setRating(5);
        req.setComment("Amazing event!");

        when(eventRepository.findById("E-001")).thenReturn(Optional.of(buildCompletedEvent()));
        when(feedbackRepository.existsByEventIdAndUserId("E-001", "U-0001")).thenReturn(false);
        when(userRepository.findById("U-0001")).thenReturn(Optional.of(buildUser()));
        when(feedbackRepository.save(any(EventFeedback.class))).thenAnswer(inv -> {
            EventFeedback fb = inv.getArgument(0);
            fb.setId(1L);
            fb.setSubmittedAt(LocalDateTime.now());
            return fb;
        });

        FeedbackResponse response = feedbackService.submitFeedback("E-001", "U-0001", req);

        assertEquals(5, response.getRating());
        assertEquals("Amazing event!", response.getComment());
        assertEquals("John D.", response.getUser());
    }

    @Test
    @DisplayName("submitFeedback() — event not found → throws ResourceNotFoundException")
    void submitFeedback_eventNotFound_throws() {
        FeedbackRequest req = new FeedbackRequest();
        req.setRating(4);

        when(eventRepository.findById("E-999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> feedbackService.submitFeedback("E-999", "U-0001", req));
    }

    @Test
    @DisplayName("submitFeedback() — event not completed → throws IllegalStateException")
    void submitFeedback_eventNotCompleted_throwsIllegalState() {
        FeedbackRequest req = new FeedbackRequest();
        req.setRating(4);

        Event ongoingEvent = Event.builder()
                .eventId("E-002").eventStatus("ongoing").build();
        when(eventRepository.findById("E-002")).thenReturn(Optional.of(ongoingEvent));

        assertThrows(IllegalStateException.class,
                () -> feedbackService.submitFeedback("E-002", "U-0001", req));
    }

    @Test
    @DisplayName("submitFeedback() — already submitted → throws DuplicateResourceException")
    void submitFeedback_alreadySubmitted_throwsDuplicate() {
        FeedbackRequest req = new FeedbackRequest();
        req.setRating(3);

        when(eventRepository.findById("E-001")).thenReturn(Optional.of(buildCompletedEvent()));
        when(feedbackRepository.existsByEventIdAndUserId("E-001", "U-0001")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> feedbackService.submitFeedback("E-001", "U-0001", req));
    }

    @Test
    @DisplayName("getFeedbacksForEvent() returns sorted list")
    void getFeedbacksForEvent_returnsList() {
        EventFeedback fb = EventFeedback.builder()
                .id(1L)
                .eventId("E-001")
                .userId("U-0001")
                .userDisplay("John D.")
                .rating(5)
                .comment("Great!")
                .submittedAt(LocalDateTime.now())
                .build();

        when(feedbackRepository.findByEventIdOrderBySubmittedAtDesc("E-001"))
                .thenReturn(List.of(fb));

        List<FeedbackResponse> feedbacks = feedbackService.getFeedbacksForEvent("E-001");

        assertEquals(1, feedbacks.size());
        assertEquals(5, feedbacks.get(0).getRating());
        assertEquals("John D.", feedbacks.get(0).getUser());
    }

    @Test
    @DisplayName("submitFeedback() — null comment defaults to empty string")
    void submitFeedback_nullCommentDefaultsToEmpty() {
        FeedbackRequest req = new FeedbackRequest();
        req.setRating(4);
        req.setComment(null);

        when(eventRepository.findById("E-001")).thenReturn(Optional.of(buildCompletedEvent()));
        when(feedbackRepository.existsByEventIdAndUserId("E-001", "U-0001")).thenReturn(false);
        when(userRepository.findById("U-0001")).thenReturn(Optional.of(buildUser()));
        when(feedbackRepository.save(any(EventFeedback.class))).thenAnswer(inv -> {
            EventFeedback fb = inv.getArgument(0);
            fb.setId(2L);
            fb.setSubmittedAt(LocalDateTime.now());
            return fb;
        });

        FeedbackResponse response = feedbackService.submitFeedback("E-001", "U-0001", req);

        assertEquals("", response.getComment());
    }
}
