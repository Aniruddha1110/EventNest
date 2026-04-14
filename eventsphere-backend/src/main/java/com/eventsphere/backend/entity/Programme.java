package com.eventsphere.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "PROGRAMMES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Programme
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PROGRAMME_ID")
    private String programmeId;

    @Column(name = "PROGRAMME_NAME", length = 50, nullable = false)
    private String programmeName;

    @Column(name = "PROGRAMME_DESCRIPTION", length = 500)
    private String programmeDescription;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "EVENT_ID", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ORGANISER_ID", nullable = false)
    private Organiser organiser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "VENUE_ID", nullable = false)
    private Venue venue;

    @Column(name = "PROGRAMME_STATUS", length = 10)
    private String programmeStatus;
}