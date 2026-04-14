package com.eventsphere.backend.entity.h2;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * H2 in-memory entity — stores user feedback for completed events.
 *
 * Does NOT exist in Oracle — entirely managed in H2.
 *
 * Feedback is submitted through EventDetailPage when event status = "completed".
 * On every restart, DataLoader seeds mock feedbacks for all completed events
 * using real usernames from Oracle USERS so the CompletedEventsPage and
 * EventDetailPage always show populated ratings from day one.
 *
 * Real feedback submitted during a session is stored here until restart.
 * Duplicate submission is prevented by a UNIQUE constraint on (EVENT_ID, USER_ID).
 */
@Entity
@Table(
        name = "EVENT_FEEDBACK",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_feedback_event_user",
                columnNames = {"EVENT_ID", "USER_ID"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    /**
     * Links to Oracle EVENTS.EVENT_ID (e.g. E-001).
     */
    @Column(name = "EVENT_ID", length = 5, nullable = false)
    private String eventId;

    /**
     * Links to Oracle USERS.USER_ID (e.g. U-0001).
     * Together with eventId forms a UNIQUE pair — one feedback per user per event.
     */
    @Column(name = "USER_ID", length = 10, nullable = false)
    private String userId;

    /**
     * Display name shown on feedback card: "FirstName L." format.
     * e.g. "Aniruddha D."
     * Pre-computed at feedback submission time so we don't need an Oracle join
     * every time we read feedbacks.
     */
    @Column(name = "USER_DISPLAY", length = 60, nullable = false)
    private String userDisplay;

    /**
     * Star rating 1–5.
     */
    @Column(name = "RATING", nullable = false)
    private Integer rating;

    /**
     * Text comment. Optional — can be empty string but not null.
     */
    @Column(name = "COMMENT", length = 500)
    private String comment;

    /**
     * Auto-set to current timestamp on insert.
     */
    @CreationTimestamp
    @Column(name = "SUBMITTED_AT", nullable = false, updatable = false)
    private LocalDateTime submittedAt;
}