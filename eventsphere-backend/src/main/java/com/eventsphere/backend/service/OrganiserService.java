package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.AddOrganiserRequest;
import com.eventsphere.backend.dto.request.UpdateOrganiserRequest;
import com.eventsphere.backend.dto.response.OrganiserResponse;
import com.eventsphere.backend.entity.Organiser;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.OrganiserRepository;
import com.eventsphere.backend.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganiserService {

    private final OrganiserRepository organiserRepository;

    public OrganiserResponse getProfile(String organiserId) {
        Organiser o = organiserRepository.findById(organiserId)
                .orElseThrow(() -> new ResourceNotFoundException("Organiser not found: " + organiserId));
        return toResponse(o);
    }

    public List<OrganiserResponse> getAllOrganisers() {
        return organiserRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional("oracleTransactionManager")
    public OrganiserResponse addOrganiser(AddOrganiserRequest req) {
        if (organiserRepository.existsByOrganiserEmail(req.getEmail()))
            throw new DuplicateResourceException("Email already in use.");
        if (organiserRepository.existsByOrganiserUsername(req.getUsername()))
            throw new DuplicateResourceException("Username already taken.");

        Organiser org = Organiser.builder()
                .organiserName(req.getName())
                .organiserEmail(req.getEmail())
                .organiserPhoneNo(req.getPhone())
                .organiserUsername(req.getUsername())
                .organiserPassword(PasswordUtil.hash(req.getPassword()))
                .build();

        Organiser saved = organiserRepository.save(org);
        log.info("Organiser added by admin: organiserId={}", saved.getOrganiserId());
        return toResponse(saved);
    }

    @Transactional("oracleTransactionManager")
    public void deleteOrganiser(String organiserId) {
        Organiser org = organiserRepository.findById(organiserId)
                .orElseThrow(() -> new ResourceNotFoundException("Organiser not found: " + organiserId));
        organiserRepository.delete(org);
        log.info("Organiser deleted: organiserId={}", organiserId);
    }

    @Transactional("oracleTransactionManager")
    public OrganiserResponse updateOrganiser(String organiserId, UpdateOrganiserRequest req) {
        Organiser org = organiserRepository.findById(organiserId)
                .orElseThrow(() -> new ResourceNotFoundException("Organiser not found: " + organiserId));
        if (req.getName()     != null) org.setOrganiserName(req.getName());
        if (req.getEmail()    != null) org.setOrganiserEmail(req.getEmail());
        if (req.getPhone()    != null) org.setOrganiserPhoneNo(req.getPhone());
        if (req.getUsername() != null) org.setOrganiserUsername(req.getUsername());
        Organiser saved = organiserRepository.save(org);
        log.info("Organiser updated by admin: organiserId={}", organiserId);
        return toResponse(saved);
    }

    public OrganiserResponse toResponse(Organiser o) {
        return OrganiserResponse.builder()
                .organiserId(o.getOrganiserId())
                .organiserName(o.getOrganiserName())
                .organiserEmail(o.getOrganiserEmail())
                .organiserPhoneNo(o.getOrganiserPhoneNo())
                .organiserUsername(o.getOrganiserUsername())
                .build();
    }
}