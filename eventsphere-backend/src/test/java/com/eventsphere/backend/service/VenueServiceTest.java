package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.AddVenueRequest;
import com.eventsphere.backend.dto.response.VenueResponse;
import com.eventsphere.backend.entity.Venue;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.ProgrammeRepository;
import com.eventsphere.backend.repository.VenueRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link VenueService}.
 */
@ExtendWith(MockitoExtension.class)
class VenueServiceTest {

    @Mock private VenueRepository     venueRepository;
    @Mock private ProgrammeRepository programmeRepository;

    @InjectMocks
    private VenueService venueService;

    private Venue buildVenue() {
        return Venue.builder()
                .venueId("V-001")
                .venueName("Main Hall")
                .venueCapacity(500)
                .venueAvailability("Y")
                .build();
    }

    @Test
    @DisplayName("getAllVenues() returns list")
    void getAllVenues_returnsList() {
        when(venueRepository.findAll()).thenReturn(List.of(buildVenue()));

        List<VenueResponse> venues = venueService.getAllVenues();

        assertEquals(1, venues.size());
        assertEquals("Main Hall", venues.get(0).getVenueName());
    }

    @Test
    @DisplayName("getVenue() — found")
    void getVenue_found() {
        when(venueRepository.findById("V-001")).thenReturn(Optional.of(buildVenue()));

        VenueResponse response = venueService.getVenue("V-001");

        assertEquals("V-001", response.getVenueId());
        assertEquals(500, response.getVenueCapacity());
    }

    @Test
    @DisplayName("getVenue() — not found → throws")
    void getVenue_notFound_throws() {
        when(venueRepository.findById("V-999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> venueService.getVenue("V-999"));
    }

    @Test
    @DisplayName("addVenue() — success")
    void addVenue_success() {
        AddVenueRequest req = new AddVenueRequest();
        req.setVenueName("Conference Room");
        req.setVenueCapacity(100);
        req.setVenueAvailability("Y");

        when(venueRepository.existsByVenueNameIgnoreCase("Conference Room")).thenReturn(false);
        when(venueRepository.save(any(Venue.class))).thenAnswer(inv -> {
            Venue v = inv.getArgument(0);
            v.setVenueId("V-002");
            return v;
        });

        VenueResponse response = venueService.addVenue(req);

        assertEquals("V-002", response.getVenueId());
        assertEquals("Conference Room", response.getVenueName());
    }

    @Test
    @DisplayName("addVenue() — default availability 'Y' when null")
    void addVenue_defaultAvailability() {
        AddVenueRequest req = new AddVenueRequest();
        req.setVenueName("New Room");
        req.setVenueCapacity(50);
        // venueAvailability is null

        when(venueRepository.existsByVenueNameIgnoreCase("New Room")).thenReturn(false);
        when(venueRepository.save(any(Venue.class))).thenAnswer(inv -> {
            Venue v = inv.getArgument(0);
            v.setVenueId("V-003");
            return v;
        });

        VenueResponse response = venueService.addVenue(req);

        assertEquals("Y", response.getVenueAvailability());
    }

    @Test
    @DisplayName("addVenue() — duplicate name → throws")
    void addVenue_duplicateName_throws() {
        AddVenueRequest req = new AddVenueRequest();
        req.setVenueName("Main Hall");

        when(venueRepository.existsByVenueNameIgnoreCase("Main Hall")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> venueService.addVenue(req));
    }

    @Test
    @DisplayName("updateVenue() — success")
    void updateVenue_success() {
        Venue venue = buildVenue();
        when(venueRepository.findById("V-001")).thenReturn(Optional.of(venue));
        when(venueRepository.save(any(Venue.class))).thenAnswer(inv -> inv.getArgument(0));

        AddVenueRequest req = new AddVenueRequest();
        req.setVenueName("Updated Hall");
        req.setVenueCapacity(600);

        VenueResponse response = venueService.updateVenue("V-001", req);

        assertEquals("Updated Hall", response.getVenueName());
        assertEquals(600, response.getVenueCapacity());
    }

    @Test
    @DisplayName("deleteVenue() — success when no linked programmes")
    void deleteVenue_success() {
        Venue venue = buildVenue();
        when(venueRepository.findById("V-001")).thenReturn(Optional.of(venue));
        when(programmeRepository.existsByVenue(venue)).thenReturn(false);

        assertDoesNotThrow(() -> venueService.deleteVenue("V-001"));
        verify(venueRepository).delete(venue);
    }

    @Test
    @DisplayName("deleteVenue() — linked programmes → throws IllegalStateException")
    void deleteVenue_linkedProgrammes_throwsIllegalState() {
        Venue venue = buildVenue();
        when(venueRepository.findById("V-001")).thenReturn(Optional.of(venue));
        when(programmeRepository.existsByVenue(venue)).thenReturn(true);

        assertThrows(IllegalStateException.class,
                () -> venueService.deleteVenue("V-001"));
        verify(venueRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteVenue() — not found → throws")
    void deleteVenue_notFound_throws() {
        when(venueRepository.findById("V-999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> venueService.deleteVenue("V-999"));
    }
}
