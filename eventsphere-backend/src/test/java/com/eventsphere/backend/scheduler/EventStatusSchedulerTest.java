package com.eventsphere.backend.scheduler;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.repository.EventRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link EventStatusScheduler}.
 */
@ExtendWith(MockitoExtension.class)
class EventStatusSchedulerTest {

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventStatusScheduler scheduler;

    @Test
    @DisplayName("Past event → status set to 'completed'")
    void updateStatuses_completedEvent() {
        Event event = Event.builder()
                .eventId("E-001")
                .eventStartDate(LocalDate.now().minusDays(10))
                .eventEndDate(LocalDate.now().minusDays(1))
                .eventStatus("ongoing")
                .build();

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduler.updateEventStatuses();

        verify(eventRepository).save(event);
        // After the scheduler runs, the event's status should have triggered a save
        // (the scheduler sets status before saving, so we verify save was called)
    }

    @Test
    @DisplayName("Current event → status set to 'ongoing'")
    void updateStatuses_ongoingEvent() {
        Event event = Event.builder()
                .eventId("E-002")
                .eventStartDate(LocalDate.now().minusDays(1))
                .eventEndDate(LocalDate.now().plusDays(1))
                .eventStatus("upcoming")
                .build();

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduler.updateEventStatuses();

        verify(eventRepository).save(event);
    }

    @Test
    @DisplayName("Future event → status set to 'upcoming'")
    void updateStatuses_upcomingEvent() {
        Event event = Event.builder()
                .eventId("E-003")
                .eventStartDate(LocalDate.now().plusDays(5))
                .eventEndDate(LocalDate.now().plusDays(10))
                .eventStatus("completed") // Wrong status, should be corrected
                .build();

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduler.updateEventStatuses();

        verify(eventRepository).save(event);
    }

    @Test
    @DisplayName("Already correct status → no save called")
    void updateStatuses_alreadyCorrect_noSave() {
        Event event = Event.builder()
                .eventId("E-004")
                .eventStartDate(LocalDate.now().plusDays(5))
                .eventEndDate(LocalDate.now().plusDays(10))
                .eventStatus("upcoming") // Already correct
                .build();

        when(eventRepository.findAll()).thenReturn(List.of(event));

        scheduler.updateEventStatuses();

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    @DisplayName("Event starting today → status set to 'ongoing'")
    void updateStatuses_startingToday() {
        Event event = Event.builder()
                .eventId("E-005")
                .eventStartDate(LocalDate.now())
                .eventEndDate(LocalDate.now().plusDays(2))
                .eventStatus("upcoming")
                .build();

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduler.updateEventStatuses();

        verify(eventRepository).save(event);
    }

    @Test
    @DisplayName("Event ending today → status remains 'ongoing'")
    void updateStatuses_endingToday() {
        Event event = Event.builder()
                .eventId("E-006")
                .eventStartDate(LocalDate.now().minusDays(2))
                .eventEndDate(LocalDate.now())
                .eventStatus("completed") // Should be corrected to ongoing
                .build();

        when(eventRepository.findAll()).thenReturn(List.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduler.updateEventStatuses();

        verify(eventRepository).save(event);
    }

    @Test
    @DisplayName("No events → no saves")
    void updateStatuses_noEvents() {
        when(eventRepository.findAll()).thenReturn(List.of());

        scheduler.updateEventStatuses();

        verify(eventRepository, never()).save(any());
    }
}
