package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.AddAdminRequest;
import com.eventsphere.backend.dto.response.AdminResponse;
import com.eventsphere.backend.entity.Admin;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.exception.UnauthorisedAccessException;
import com.eventsphere.backend.repository.AdminRepository;
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
 * Unit tests for {@link AdminService}.
 */
@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private AdminRepository adminRepository;

    @InjectMocks
    private AdminService adminService;

    private Admin buildAdmin(String id) {
        return Admin.builder()
                .adminId(id)
                .adminFirstName("Admin")
                .adminLastName("User")
                .adminEmail("admin@test.com")
                .adminUsername("adminuser")
                .adminPassword("hashedpw")
                .adminPhoneNumber("9876543210")
                .build();
    }

    private AddAdminRequest buildAddRequest() {
        AddAdminRequest req = new AddAdminRequest();
        req.setFirstName("New");
        req.setLastName("Admin");
        req.setEmail("new@admin.com");
        req.setPhone("1234567890");
        req.setUsername("newadmin");
        req.setPassword("password123");
        return req;
    }

    @Test
    @DisplayName("getProfile() — found")
    void getProfile_found() {
        when(adminRepository.findById("A-0004")).thenReturn(Optional.of(buildAdmin("A-0004")));

        AdminResponse response = adminService.getProfile("A-0004");

        assertEquals("A-0004", response.getAdminId());
        assertEquals("Admin", response.getAdminFirstName());
    }

    @Test
    @DisplayName("getProfile() — not found → throws")
    void getProfile_notFound_throws() {
        when(adminRepository.findById("A-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> adminService.getProfile("A-9999"));
    }

    @Test
    @DisplayName("getAllAdmins() returns list")
    void getAllAdmins_returnsList() {
        when(adminRepository.findAll()).thenReturn(List.of(buildAdmin("A-0001")));

        List<AdminResponse> admins = adminService.getAllAdmins();

        assertEquals(1, admins.size());
    }

    @Test
    @DisplayName("addAdmin() — success")
    void addAdmin_success() {
        AddAdminRequest req = buildAddRequest();
        when(adminRepository.existsByAdminEmail("new@admin.com")).thenReturn(false);
        when(adminRepository.existsByAdminUsername("newadmin")).thenReturn(false);
        when(adminRepository.save(any(Admin.class))).thenAnswer(inv -> {
            Admin a = inv.getArgument(0);
            a.setAdminId("A-0004");
            return a;
        });

        AdminResponse response = adminService.addAdmin(req);

        assertEquals("A-0004", response.getAdminId());
        assertEquals("New", response.getAdminFirstName());
    }

    @Test
    @DisplayName("addAdmin() — duplicate email → throws")
    void addAdmin_duplicateEmail_throws() {
        AddAdminRequest req = buildAddRequest();
        when(adminRepository.existsByAdminEmail("new@admin.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> adminService.addAdmin(req));
    }

    @Test
    @DisplayName("addAdmin() — duplicate username → throws")
    void addAdmin_duplicateUsername_throws() {
        AddAdminRequest req = buildAddRequest();
        when(adminRepository.existsByAdminEmail("new@admin.com")).thenReturn(false);
        when(adminRepository.existsByAdminUsername("newadmin")).thenReturn(true);

        assertThrows(DuplicateResourceException.class,
                () -> adminService.addAdmin(req));
    }

    @Test
    @DisplayName("removeAdmin() — success for non-protected ID")
    void removeAdmin_success() {
        Admin admin = buildAdmin("A-0004");
        when(adminRepository.findById("A-0004")).thenReturn(Optional.of(admin));

        assertDoesNotThrow(() -> adminService.removeAdmin("A-0004"));
        verify(adminRepository).delete(admin);
    }

    @Test
    @DisplayName("removeAdmin() — protected ID A-0001 → throws UnauthorisedAccessException")
    void removeAdmin_protectedId_throwsUnauthorised() {
        assertThrows(UnauthorisedAccessException.class,
                () -> adminService.removeAdmin("A-0001"));
        verify(adminRepository, never()).delete(any());
    }

    @Test
    @DisplayName("removeAdmin() — protected ID A-0002 → throws")
    void removeAdmin_protectedId2_throwsUnauthorised() {
        assertThrows(UnauthorisedAccessException.class,
                () -> adminService.removeAdmin("A-0002"));
    }

    @Test
    @DisplayName("removeAdmin() — protected ID A-0003 → throws")
    void removeAdmin_protectedId3_throwsUnauthorised() {
        assertThrows(UnauthorisedAccessException.class,
                () -> adminService.removeAdmin("A-0003"));
    }

    @Test
    @DisplayName("removeAdmin() — not found → throws ResourceNotFoundException")
    void removeAdmin_notFound_throws() {
        when(adminRepository.findById("A-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> adminService.removeAdmin("A-9999"));
    }

    @Test
    @DisplayName("updateAdmin() — updates fields")
    void updateAdmin_success() {
        Admin admin = buildAdmin("A-0004");
        when(adminRepository.findById("A-0004")).thenReturn(Optional.of(admin));
        when(adminRepository.save(any(Admin.class))).thenAnswer(inv -> inv.getArgument(0));

        AddAdminRequest req = new AddAdminRequest();
        req.setFirstName("Updated");
        req.setEmail("updated@admin.com");

        AdminResponse response = adminService.updateAdmin("A-0004", req);

        assertEquals("Updated", response.getAdminFirstName());
        assertEquals("updated@admin.com", response.getAdminEmail());
    }

    @Test
    @DisplayName("getAdminPhoto() — returns bytes when photo exists")
    void getAdminPhoto_returnsBytes() {
        Admin admin = buildAdmin("A-0001");
        admin.setAdminBiometric(new byte[]{1, 2, 3});
        when(adminRepository.findById("A-0001")).thenReturn(Optional.of(admin));

        byte[] photo = adminService.getAdminPhoto("A-0001");

        assertNotNull(photo);
        assertEquals(3, photo.length);
    }

    @Test
    @DisplayName("getAdminPhoto() — returns null when no photo")
    void getAdminPhoto_noPhoto_returnsNull() {
        Admin admin = buildAdmin("A-0001");
        admin.setAdminBiometric(null);
        when(adminRepository.findById("A-0001")).thenReturn(Optional.of(admin));

        assertNull(adminService.getAdminPhoto("A-0001"));
    }

    @Test
    @DisplayName("toResponse() sets isProtected flag for protected IDs")
    void toResponse_setsProtectedFlag() {
        Admin protectedAdmin = buildAdmin("A-0001");
        AdminResponse response = adminService.toResponse(protectedAdmin);
        assertTrue(response.isProtected());

        Admin normalAdmin = buildAdmin("A-0004");
        AdminResponse response2 = adminService.toResponse(normalAdmin);
        assertFalse(response2.isProtected());
    }

    @Test
    @DisplayName("toResponse() sets photoUrl when biometric data exists")
    void toResponse_setsPhotoUrl() {
        Admin admin = buildAdmin("A-0004");
        admin.setAdminBiometric(new byte[]{1, 2, 3});

        AdminResponse response = adminService.toResponse(admin);

        assertNotNull(response.getPhotoUrl());
        assertTrue(response.getPhotoUrl().contains("Admin"));
    }
}
