package com.eventsphere.backend.repository;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.Organiser;
import com.eventsphere.backend.entity.Programme;
import com.eventsphere.backend.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * JPA repository for the PROGRAMMES Oracle table.
 * Uses the PRIMARY (Oracle) DataSource.
 */
@Repository
public interface ProgrammeRepository extends JpaRepository<Programme, String>
{
    List<Programme> findByEvent(Event event);

    List<Programme> findByEvent_EventId(String eventId);

    List<Programme> findByOrganiser(Organiser organiser);

    List<Programme> findByOrganiser_OrganiserId(String organiserId);

    List<Programme> findByProgrammeStatus(String programmeStatus);

    List<Programme> findByEvent_EventIdAndProgrammeStatus(
            String eventId, String programmeStatus);

    long countByProgrammeStatus(String programmeStatus);

    boolean existsByVenue(Venue venue);

    @Query("SELECT p FROM Programme p " +
            "JOIN FETCH p.venue " +
            "JOIN FETCH p.organiser " +
            "WHERE p.event.eventId = :eventId")
    List<Programme> findByEventIdWithVenueAndOrganiser(String eventId);

    long countByVenueAndProgrammeStatus(Venue venue, String programmeStatus);
}