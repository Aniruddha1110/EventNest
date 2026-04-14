package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.response.ProgrammeResponse;
import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.Organiser;
import com.eventsphere.backend.entity.Programme;
import com.eventsphere.backend.entity.Venue;
import com.eventsphere.backend.entity.h2.ProgrammeMeta;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.ProgrammeRepository;
import com.eventsphere.backend.repository.h2.ProgrammeMetaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ProgrammeService}.
 */
@ExtendWith(MockitoExtension.class)
class ProgrammeServiceTest {

    @Mock private ProgrammeRepository     programmeRepository;
    @Mock private ProgrammeMetaRepository programmeMetaRepository;
    @Mock private MailService             mailService;

    @InjectMocks
    private ProgrammeService programmeService;

    private Programme buildProgramme() {
        Venue venue = Venue.builder().venueId("V-001").venueName("Main Hall").venueCapacity(500).build();
        Organiser organiser = Organiser.builder()
                .organiserId("O-0001").organiserName("TestOrg").organiserEmail("org@test.com").build();
        Event event = Event.builder().eventId("E-001").eventName("Tech Fest").build();

        return Programme.builder()
                .programmeId("P-0001")
                .programmeName("Hackathon")
                .programmeDescription("24hr coding challenge")
                .programmeStatus("approved")
                .event(event)
                .organiser(organiser)
                .venue(venue)
                .build();
    }

    @Test
    @DisplayName("getAllProgrammes() — no filter returns all")
    void getAllProgrammes_noFilter() {
        when(programmeRepository.findAll()).thenReturn(List.of(buildProgramme()));
        when(programmeMetaRepository.findByProgrammeId("P-0001"))
                .thenReturn(Optional.of(ProgrammeMeta.builder().programmeId("P-0001").price(199).seatsBooked(10).build()));

        List<ProgrammeResponse> list = programmeService.getAllProgrammes(null);

        assertEquals(1, list.size());
        assertEquals("P-0001", list.get(0).getProgrammeId());
        assertEquals(199, list.get(0).getPrice());
    }

    @Test
    @DisplayName("getAllProgrammes() — with status filter")
    void getAllProgrammes_withStatusFilter() {
        when(programmeRepository.findByProgrammeStatus("approved")).thenReturn(List.of(buildProgramme()));
        when(programmeMetaRepository.findByProgrammeId("P-0001"))
                .thenReturn(Optional.of(ProgrammeMeta.builder().programmeId("P-0001").price(0).seatsBooked(0).build()));

        List<ProgrammeResponse> list = programmeService.getAllProgrammes("approved");

        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("getProgrammesByOrganiser() returns filtered list")
    void getProgrammesByOrganiser() {
        when(programmeRepository.findByOrganiser_OrganiserId("O-0001")).thenReturn(List.of(buildProgramme()));
        when(programmeMetaRepository.findByProgrammeId(anyString())).thenReturn(Optional.empty());

        List<ProgrammeResponse> list = programmeService.getProgrammesByOrganiser("O-0001");

        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("getProgrammesByEvent() returns list")
    void getProgrammesByEvent() {
        when(programmeRepository.findByEventIdWithVenueAndOrganiser("E-001")).thenReturn(List.of(buildProgramme()));
        when(programmeMetaRepository.findByProgrammeId(anyString())).thenReturn(Optional.empty());

        List<ProgrammeResponse> list = programmeService.getProgrammesByEvent("E-001");

        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("updateStatus() to approved — sends approval email")
    void updateStatus_approved_sendsEmail() {
        Programme p = buildProgramme();
        when(programmeRepository.findById("P-0001")).thenReturn(Optional.of(p));
        when(programmeRepository.save(any(Programme.class))).thenAnswer(inv -> inv.getArgument(0));
        when(programmeMetaRepository.findByProgrammeId("P-0001")).thenReturn(Optional.empty());

        ProgrammeResponse response = programmeService.updateStatus("P-0001", "approved");

        assertEquals("approved", response.getProgrammeStatus());
        verify(mailService).sendProgrammeApproved("org@test.com", "TestOrg", "Hackathon");
    }

    @Test
    @DisplayName("updateStatus() to rejected — sends rejection email")
    void updateStatus_rejected_sendsEmail() {
        Programme p = buildProgramme();
        when(programmeRepository.findById("P-0001")).thenReturn(Optional.of(p));
        when(programmeRepository.save(any(Programme.class))).thenAnswer(inv -> inv.getArgument(0));
        when(programmeMetaRepository.findByProgrammeId("P-0001")).thenReturn(Optional.empty());

        programmeService.updateStatus("P-0001", "rejected");

        verify(mailService).sendProgrammeRejected("org@test.com", "TestOrg", "Hackathon");
    }

    @Test
    @DisplayName("deleteProgramme() — success")
    void deleteProgramme_success() {
        Programme p = buildProgramme();
        when(programmeRepository.findById("P-0001")).thenReturn(Optional.of(p));

        assertDoesNotThrow(() -> programmeService.deleteProgramme("P-0001"));
        verify(programmeRepository).delete(p);
    }

    @Test
    @DisplayName("deleteProgramme() — not found → throws")
    void deleteProgramme_notFound_throws() {
        when(programmeRepository.findById("P-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> programmeService.deleteProgramme("P-9999"));
    }

    @Test
    @DisplayName("toResponse() calculates seatsLeft correctly")
    void toResponse_calculatesSeatsLeft() {
        Programme p = buildProgramme();
        when(programmeMetaRepository.findByProgrammeId("P-0001"))
                .thenReturn(Optional.of(ProgrammeMeta.builder()
                        .programmeId("P-0001").price(199).seatsBooked(100).build()));

        ProgrammeResponse response = programmeService.toResponse(p);

        assertEquals(500, response.getVenueCapacity());
        assertEquals(400, response.getSeatsLeft()); // 500 - 100
        assertEquals(199, response.getPrice());
    }

    @Test
    @DisplayName("toResponse() defaults to 0 price and 0 seats when no ProgrammeMeta")
    void toResponse_defaultsWhenNoMeta() {
        Programme p = buildProgramme();
        when(programmeMetaRepository.findByProgrammeId("P-0001")).thenReturn(Optional.empty());

        ProgrammeResponse response = programmeService.toResponse(p);

        assertEquals(0, response.getPrice());
        assertEquals(500, response.getSeatsLeft()); // max(0, 500 - 0)
    }
}
