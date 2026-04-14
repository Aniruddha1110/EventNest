package com.eventsphere.backend.repository.h2;

import com.eventsphere.backend.entity.h2.EventFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * H2 repository for EVENT_FEEDBACK table.
 * Uses the secondary (H2) EntityManagerFactory — configured in H2DataSourceConfig.
 */
@Repository
public interface EventFeedbackRepository extends JpaRepository<EventFeedback, Long> {

    /** EventDetailPage — load all feedback for one event, newest first. */
    List<EventFeedback> findByEventIdOrderBySubmittedAtDesc(String eventId);

    /**
     * Check if this user already submitted feedback for this event.
     * Prevents duplicate submissions — one feedback per user per event.
     */
    boolean existsByEventIdAndUserId(String eventId, String userId);

    /** Count total feedbacks for an event — used to compute averages. */
    long countByEventId(String eventId);

    /** Find a specific user's feedback for an event (for edit/delete in future). */
    Optional<EventFeedback> findByEventIdAndUserId(String eventId, String userId);
}