package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventResponse {

    private String     eventId;
    private String     eventName;
    private LocalDate  eventStartDate;
    private LocalDate  eventEndDate;
    private String     eventTime;
    private Integer    eventDuration;
    private String     eventDescription;

    private String     eventStatus;

    private String     eventType;

    private List<ProgrammeResponse> programmes;
}