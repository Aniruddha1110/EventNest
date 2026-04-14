package com.eventsphere.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "EVENTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "EVENT_ID")
    private String eventId;

    @Column(name = "EVENT_NAME", length = 50, nullable = false)
    private String eventName;

    @Column(name = "EVENT_START_DATE", nullable = false)
    private LocalDate eventStartDate;

    @Column(name = "EVENT_END_DATE", nullable = false)
    private LocalDate eventEndDate;

    @Column(name = "EVENT_TIME", length = 10, nullable = false)
    private String eventTime;

    @Column(name = "EVENT_DURATION", nullable = false)
    private Integer eventDuration;

    @Column(name = "EVENT_DESCRIPTION", length = 500)
    private String eventDescription;

    @Column(name = "EVENT_STATUS", length = 10)
    private String eventStatus;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Programme> programmes;
}