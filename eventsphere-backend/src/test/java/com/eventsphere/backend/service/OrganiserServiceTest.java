package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.AddOrganiserRequest;
import com.eventsphere.backend.dto.request.UpdateOrganiserRequest;
import com.eventsphere.backend.dto.response.OrganiserResponse;
import com.eventsphere.backend.entity.Organiser;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.OrganiserRepository;
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
 * Unit tests for {@link OrganiserService}.
 */
@ExtendWith(MockitoExtension.class)
class OrganiserServiceTest {

    @Mock
    private OrganiserRepository organiserRepository;

    @InjectMocks
    private OrganiserService organiserService;

    private Organiser buildOrganiser() {
        return Organiser.builder()
                .organiserId("O-0001")
                .organiserName("TestOrg")
                .organiserEmail("org@test.com")
                .organiserPhoneNo("9876543210")
                .organiserUsername("testorg")
                .organiserPassword("hashedpw")
                .build();
    }

    @Test
    @DisplayName("getProfile() — found")
    void getProfile_found() {
        when(organiserRepository.findById("O-0001")).thenReturn(Optional.of(buildOrganiser()));

        OrganiserResponse response = organiserService.getProfile("O-0001");

        assertEquals("O-0001", response.getOrganiserId());
        assertEquals("TestOrg", response.getOrganiserName());
    }

    @Test
    @DisplayName("getProfile() — not found → throws")
    void getProfile_notFound_throws() {
        when(organiserRepository.findById("O-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> organiserService.getProfile("O-9999"));
    }

    @Test
    @DisplayName("getAllOrganisers() returns list")
    void getAllOrganisers_returnsList() {
        when(organiserRepository.findAll()).thenReturn(List.of(buildOrganiser()));

        List<OrganiserResponse> list = organiserService.getAllOrganisers();

        assertEquals(1, list.size());
        assertEquals("O-0001", list.get(0).getOrganiserId());
    }

    @Test
    @DisplayName("addOrganiser() — success")
    void addOrganiser_success() {
        AddOrganiserRequest req = new AddOrganiserRequest();
        req.setName("NewOrg");
        req.setEmail("new@org.com");
        req.setPhone("1234567890");
        req.setUsername("neworg");
        req.setPassword("password123");

        when(organiserRepository.existsByOrganiserEmail("new@org.com")).thenReturn(false);
        when(organiserRepository.existsByOrganiserUsername("neworg")).thenReturn(false);
        when(organiserRepository.save(any(Organiser.class))).thenAnswer(inv -> {
            Organiser o = inv.getArgument(0);
            o.setOrganiserId("O-0002");
            return o;
        });

        OrganiserResponse response = organiserService.addOrganiser(req);

        assertEquals("O-0002", response.getOrganiserId());
        assertEquals("NewOrg", response.getOrganiserName());
    }

    @Test
    @DisplayName("addOrganiser() — duplicate email → throws")
    void addOrganiser_duplicateEmail_throws() {
        AddOrganiserRequest req = new AddOrganiserRequest();
        req.setEmail("existing@org.com");
        req.setUsername("neworg");

        when(organiserRepository.existsByOrganiserEmail("existing@org.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> organiserService.addOrganiser(req));
    }

    @Test
    @DisplayName("deleteOrganiser() — success")
    void deleteOrganiser_success() {
        Organiser org = buildOrganiser();
        when(organiserRepository.findById("O-0001")).thenReturn(Optional.of(org));

        assertDoesNotThrow(() -> organiserService.deleteOrganiser("O-0001"));
        verify(organiserRepository).delete(org);
    }

    @Test
    @DisplayName("deleteOrganiser() — not found → throws")
    void deleteOrganiser_notFound_throws() {
        when(organiserRepository.findById("O-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> organiserService.deleteOrganiser("O-9999"));
    }

    @Test
    @DisplayName("updateOrganiser() — updates fields")
    void updateOrganiser_updatesFields() {
        Organiser org = buildOrganiser();
        when(organiserRepository.findById("O-0001")).thenReturn(Optional.of(org));
        when(organiserRepository.save(any(Organiser.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateOrganiserRequest req = new UpdateOrganiserRequest();
        req.setName("UpdatedOrg");
        req.setEmail("updated@org.com");

        OrganiserResponse response = organiserService.updateOrganiser("O-0001", req);

        assertEquals("UpdatedOrg", response.getOrganiserName());
        assertEquals("updated@org.com", response.getOrganiserEmail());
    }

    @Test
    @DisplayName("updateOrganiser() — null fields are not updated")
    void updateOrganiser_nullFieldsUnchanged() {
        Organiser org = buildOrganiser();
        when(organiserRepository.findById("O-0001")).thenReturn(Optional.of(org));
        when(organiserRepository.save(any(Organiser.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateOrganiserRequest req = new UpdateOrganiserRequest();
        // All fields null — nothing should change

        OrganiserResponse response = organiserService.updateOrganiser("O-0001", req);

        assertEquals("TestOrg", response.getOrganiserName());
        assertEquals("org@test.com", response.getOrganiserEmail());
    }
}
