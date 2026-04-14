package com.eventsphere.backend.scheduler;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventStatusScheduler {

    private final EventRepository eventRepository;

    /**
     * Runs every 60 seconds.
     * Automatically updates event status based on today's date:
     *   upcoming  → eventStartDate > today
     *   ongoing   → eventStartDate <= today <= eventEndDate
     *   completed → eventEndDate < today
     */
    @Scheduled(fixedRate = 60000)
    public void updateEventStatuses() {
        LocalDate today = LocalDate.now();
        List<Event> events = eventRepository.findAll();

        int updated = 0;
        for (Event event : events) {
            String newStatus;

            if (event.getEventEndDate().isBefore(today)) {
                newStatus = "completed";
            } else if (!event.getEventStartDate().isAfter(today)) {
                newStatus = "ongoing";
            } else {
                newStatus = "upcoming";
            }

            if (!newStatus.equals(event.getEventStatus())) {
                event.setEventStatus(newStatus);
                eventRepository.save(event);
                updated++;
                log.info("EventStatusScheduler: {} → {} (eventId={})",
                        event.getEventStatus(), newStatus, event.getEventId());
            }
        }

        if (updated > 0) {
            log.info("EventStatusScheduler: {} event(s) status updated.", updated);
        }
    }
}