package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.AddVenueRequest;
import com.eventsphere.backend.dto.response.VenueResponse;
import com.eventsphere.backend.entity.Venue;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.VenueRepository;
import com.eventsphere.backend.repository.ProgrammeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VenueService {

    private final VenueRepository     venueRepository;
    private final ProgrammeRepository programmeRepository;

    public List<VenueResponse> getAllVenues() {
        return venueRepository.findAll().stream().map(this::toResponse).toList();
    }

    public VenueResponse getVenue(String venueId) {
        Venue v = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));
        return toResponse(v);
    }

    @Transactional("oracleTransactionManager")
    public VenueResponse addVenue(AddVenueRequest req) {
        if (venueRepository.existsByVenueNameIgnoreCase(req.getVenueName()))
            throw new DuplicateResourceException("A venue with this name already exists.");

        Venue venue = Venue.builder()
                .venueName(req.getVenueName())
                .venueCapacity(req.getVenueCapacity())
                .venueAvailability(req.getVenueAvailability() != null ? req.getVenueAvailability() : "Y")
                .build();

        Venue saved = venueRepository.save(venue);
        log.info("Venue added: venueId={}", saved.getVenueId());
        return toResponse(saved);
    }

    @Transactional("oracleTransactionManager")
    public VenueResponse updateVenue(String venueId, AddVenueRequest req) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));

        if (req.getVenueName()         != null) venue.setVenueName(req.getVenueName());
        if (req.getVenueCapacity()     != null) venue.setVenueCapacity(req.getVenueCapacity());
        if (req.getVenueAvailability() != null) venue.setVenueAvailability(req.getVenueAvailability());

        return toResponse(venueRepository.save(venue));
    }

    @Transactional("oracleTransactionManager")
    public void deleteVenue(String venueId) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found: " + venueId));
        if (programmeRepository.existsByVenue(venue)) {
            throw new IllegalStateException("Cannot delete venue — it has linked programmes.");
        }
        venueRepository.delete(venue);
        log.info("Venue deleted: venueId={}", venueId);
    }

    public VenueResponse toResponse(Venue v) {
        return VenueResponse.builder()
                .venueId(v.getVenueId())
                .venueName(v.getVenueName())
                .venueCapacity(v.getVenueCapacity())
                .venueAvailability(v.getVenueAvailability())
                .build();
    }
}