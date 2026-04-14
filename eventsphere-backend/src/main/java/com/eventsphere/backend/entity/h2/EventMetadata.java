package com.eventsphere.backend.entity.h2;

import jakarta.persistence.*;
import lombok.*;

/**
 * H2 in-memory entity — stores event type and category.
 *
 * These fields do NOT exist in Oracle EVENTS table but are required
 * by the frontend on every event page (type badges, category chips, filtering).
 *
 * One row per Oracle EVENT_ID.
 *
 * EVENT_TYPE : "Free" or "Paid"
 * CATEGORY   : "Cultural" | "Technical" | "Sports" | "Ceremony" | "Food"
 *
 * Seeded by DataLoader on every startup using name-based classification
 * from Oracle EVENTS. If a new event is created by an organiser, a row
 * is inserted here at the same time (EventService.createEvent).
 *
 * Wiped and recreated on every restart (ddl-auto = create-drop).
 */
@Entity
@Table(name = "EVENT_METADATA")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    /**
     * Links to Oracle EVENTS.EVENT_ID (e.g. E-001).
     * NOT a real FK — cross-database reference kept consistent in service layer.
     * UNIQUE — one metadata row per event.
     */
    @Column(name = "EVENT_ID", length = 5, nullable = false, unique = true)
    private String eventId;

    /**
     * "Free" or "Paid".
     * Assigned by DataLoader via name-based heuristics or explicitly when
     * organiser creates a paid event in the future.
     */
    @Column(name = "EVENT_TYPE", length = 10, nullable = false)
    private String eventType;

    /**
     * "Cultural" | "Technical" | "Sports" | "Ceremony" | "Food"
     * Assigned by DataLoader.CategoryClassifier based on event name keywords.
     */
    @Column(name = "CATEGORY", length = 30, nullable = false)
    private String category;
}