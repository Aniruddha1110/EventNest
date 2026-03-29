package com.eventsphere.backend.repository;

import com.eventsphere.backend.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VenueRepository extends JpaRepository<Venue, String>
{
    List<Venue> findByVenueAvailability(String venueAvailability);

    List<Venue> findByVenueNameContainingIgnoreCase(String venueName);

    boolean existsByVenueNameIgnoreCase(String venueName);
}