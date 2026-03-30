package com.eventsphere.backend.repository;

import com.eventsphere.backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, String>
{
    List<Event> findByEventStatus(String eventStatus);

    List<Event> findByEventNameContainingIgnoreCase(String eventName);

    List<Event> findByEventStatusAndEventNameContainingIgnoreCase(
            String eventStatus, String eventName);

    List<Event> findByEventStatusOrderByEventStartDateAsc(String eventStatus);

    List<Event> findByEventStatusAndEventStartDateAfter(
            String eventStatus, LocalDate date);

    List<Event> findByEventStatusOrderByEventStartDateDesc(String eventStatus);

    long countByEventStatus(String eventStatus);

    @Query("SELECT e FROM Event e "+
            "LEFT JOIN FETCH e.programmes "+
            "WHERE e.eventId = :eventId")
    Optional<Event> findByIdWithProgrammes(String eventId);
}