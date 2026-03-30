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
    @Column(name = "VENUE_ID", length = 10, nullable = false,
            insertable = false, updatable = false)
    private String venueId;

    @Column(name = "VENUE_NAME", length = 50)
    private String venueName;

    @Column(name = "VENUE_CAPACITY")
    private Integer venueCapacity;

    @Column(name = "VENUE_AVAILABILITY", columnDefinition = "CHAR(1) DEFAULT 'Y'")
    private String venueAvailability;
}