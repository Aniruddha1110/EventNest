package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.response.ProgrammeResponse;
import com.eventsphere.backend.entity.Programme;
import com.eventsphere.backend.entity.h2.ProgrammeMeta;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.ProgrammeRepository;
import com.eventsphere.backend.repository.h2.ProgrammeMetaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Programme service — reads Oracle for programme data and H2 ProgrammeMeta
 * for price and seat booking counts.
 *
 * toResponse() always pulls the latest price and seatsBooked from H2 so
 * the seat fill progress bar on EventDetailPage reflects real bookings
 * made during this session.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProgrammeService {

    private final ProgrammeRepository    programmeRepository;
    private final ProgrammeMetaRepository programmeMetaRepository;
    private final MailService            mailService;

    // ── Queries ───────────────────────────────────────────────────────────────

    public List<ProgrammeResponse> getAllProgrammes(String status) {
        List<Programme> list = (status != null && !status.isBlank())
                ? programmeRepository.findByProgrammeStatus(status)
                : programmeRepository.findAll();
        return list.stream().map(this::toResponse).toList();
    }

    public List<ProgrammeResponse> getProgrammesByOrganiser(String organiserId) {
        return programmeRepository.findByOrganiser_OrganiserId(organiserId)
                .stream().map(this::toResponse).toList();
    }

    public List<ProgrammeResponse> getProgrammesByEvent(String eventId) {
        return programmeRepository.findByEventIdWithVenueAndOrganiser(eventId)
                .stream().map(this::toResponse).toList();
    }

    // ── Status update (admin approve / reject) ────────────────────────────────

    @Transactional("oracleTransactionManager")
    public ProgrammeResponse updateStatus(String programmeId, String status) {
        Programme p = programmeRepository.findById(programmeId)
                .orElseThrow(() -> new ResourceNotFoundException("Programme not found: " + programmeId));
        p.setProgrammeStatus(status);
        programmeRepository.save(p);
        log.info("Programme status updated: id={}, status={}", programmeId, status);

        if (p.getOrganiser() != null) {
            if ("approved".equals(status)) {
                mailService.sendProgrammeApproved(
                        p.getOrganiser().getOrganiserEmail(),
                        p.getOrganiser().getOrganiserName(),
                        p.getProgrammeName());
            } else if ("rejected".equals(status)) {
                mailService.sendProgrammeRejected(
                        p.getOrganiser().getOrganiserEmail(),
                        p.getOrganiser().getOrganiserName(),
                        p.getProgrammeName());
            }
        }
        return toResponse(p);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public void deleteProgramme(String programmeId) {
        Programme p = programmeRepository.findById(programmeId)
                .orElseThrow(() -> new ResourceNotFoundException("Programme not found: " + programmeId));
        programmeRepository.delete(p);
        log.info("Programme deleted: programmeId={}", programmeId);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    /**
     * Builds ProgrammeResponse.
     * Oracle supplies structural data (name, description, venue, organiser).
     * H2 ProgrammeMeta supplies price and seatsBooked.
     * seatsLeft = venueCapacity - seatsBooked.
     */
    public ProgrammeResponse toResponse(Programme p) {

        // Pull price and bookings from H2 — graceful fallback to 0/0 if not seeded yet
        ProgrammeMeta meta = programmeMetaRepository
                .findByProgrammeId(p.getProgrammeId())
                .orElse(null);

        int price       = (meta != null) ? meta.getPrice()       : 0;
        int seatsBooked = (meta != null) ? meta.getSeatsBooked() : 0;
        int capacity    = (p.getVenue() != null && p.getVenue().getVenueCapacity() != null)
                ? p.getVenue().getVenueCapacity() : 0;
        int seatsLeft   = Math.max(0, capacity - seatsBooked);

        return ProgrammeResponse.builder()
                .programmeId(p.getProgrammeId())
                .programmeName(p.getProgrammeName())
                .programmeDescription(p.getProgrammeDescription())
                .programmeStatus(p.getProgrammeStatus())
                .eventId(      p.getEvent()     != null ? p.getEvent().getEventId()           : null)
                .eventName(    p.getEvent()     != null ? p.getEvent().getEventName()         : null)
                .organiserId(  p.getOrganiser() != null ? p.getOrganiser().getOrganiserId()   : null)
                .organiserName(p.getOrganiser() != null ? p.getOrganiser().getOrganiserName() : null)
                .venueId(      p.getVenue()     != null ? p.getVenue().getVenueId()           : null)
                .venueName(    p.getVenue()     != null ? p.getVenue().getVenueName()         : null)
                .venueCapacity(capacity)
                .seatsLeft(seatsLeft)
                .price(price)
                .build();
    }
}