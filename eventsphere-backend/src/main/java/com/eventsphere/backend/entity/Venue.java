package com.eventsphere.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "VENUES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venue
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VENUE_ID")
    private String venueId;

    @Column(name = "VENUE_NAME", length = 50)
    private String venueName;

    @Column(name = "VENUE_CAPACITY")
    private Integer venueCapacity;

    @Column(name = "VENUE_AVAILABILITY", columnDefinition = "CHAR(1) DEFAULT 'Y'")
    private String venueAvailability;
}