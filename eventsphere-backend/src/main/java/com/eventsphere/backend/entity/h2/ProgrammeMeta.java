package com.eventsphere.backend.entity.h2;

import jakarta.persistence.*;
import lombok.*;

/**
 * H2 in-memory entity — stores programme price and seat booking count.
 *
 * Neither PRICE nor SEATS_BOOKED exist in Oracle PROGRAMMES table.
 * They are managed entirely in H2.
 *
 * One row per Oracle PROGRAMME_ID.
 *
 * PRICE:        ₹0 for free events. ₹99/₹199/₹299/₹499 for paid events.
 *               Assigned by DataLoader based on EventMetadata.eventType.
 *
 * SEATS_BOOKED: Starts at 0 on every restart.
 *               Incremented by BankService.recordSuccess() on every successful payment.
 *               seatsLeft = venueCapacity (from Oracle) - seatsBooked (from here).
 *
 * EventService reads ProgrammeMeta for each programme to compute:
 *   - seatsLeft  → displayed as progress bar in EventDetailPage
 *   - price      → displayed on ProgrammeCard and used in PaymentPage total
 *   - eventType  → derived: if any programme.price > 0 → "Paid", else "Free"
 */
@Entity
@Table(name = "PROGRAMME_META")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgrammeMeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    /**
     * Links to Oracle PROGRAMMES.PROGRAMME_ID (e.g. P-0001).
     * UNIQUE — one meta row per programme.
     */
    @Column(name = "PROGRAMME_ID", length = 10, nullable = false, unique = true)
    private String programmeId;

    /**
     * Ticket price in INR. 0 = free.
     * Assigned by DataLoader based on EventMetadata.eventType for the parent event.
     */
    @Column(name = "PRICE", nullable = false)
    private Integer price;

    /**
     * Number of seats booked via successful payments in this session.
     * Reset to 0 on every application restart (H2 wipe).
     * Incremented atomically in BankService.
     */
    @Column(name = "SEATS_BOOKED", nullable = false)
    private Integer seatsBooked;
}