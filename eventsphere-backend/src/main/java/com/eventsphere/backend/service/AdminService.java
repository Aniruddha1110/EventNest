package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.AddAdminRequest;
import com.eventsphere.backend.dto.response.AdminResponse;
import com.eventsphere.backend.entity.Admin;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.exception.UnauthorisedAccessException;
import com.eventsphere.backend.repository.AdminRepository;
import com.eventsphere.backend.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Admin management service.
 *
 * PROTECTED_IDS: A-0001, A-0002, A-0003 (Aniruddha, Anuskaa, Abhishek)
 * These IDs can NEVER be deleted under any circumstance.
 * UnauthorisedAccessException (HTTP 403) is thrown if deletion is attempted.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private static final Set<String> PROTECTED_IDS = Set.of("A-0001", "A-0002", "A-0003");
    private static final String      PHOTO_BASE_URL = "http://localhost:9090/photos/";

    private final AdminRepository adminRepository;

    // ── Get profile ───────────────────────────────────────────────────────────

    public AdminResponse getProfile(String adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminId));
        return toResponse(admin);
    }

    // ── Get all ───────────────────────────────────────────────────────────────

    public List<AdminResponse> getAllAdmins() {
        return adminRepository.findAll().stream().map(this::toResponse).toList();
    }

    // ── Add admin ─────────────────────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public AdminResponse addAdmin(AddAdminRequest req) {
        if (adminRepository.existsByAdminEmail(req.getEmail()))
            throw new DuplicateResourceException("Email already in use.");
        if (adminRepository.existsByAdminUsername(req.getUsername()))
            throw new DuplicateResourceException("Username already taken.");

        Admin admin = Admin.builder()
                .adminFirstName(req.getFirstName())
                .adminLastName(req.getLastName())
                .adminEmail(req.getEmail())
                .adminPhoneNumber(req.getPhone())
                .adminUsername(req.getUsername())
                .adminPassword(PasswordUtil.hash(req.getPassword()))
                .build();

        Admin saved = adminRepository.save(admin);
        log.info("Admin added: adminId={}", saved.getAdminId());
        return toResponse(saved);
    }

    // ── Remove admin ──────────────────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public void removeAdmin(String adminId) {
        if (PROTECTED_IDS.contains(adminId)) {
            throw new UnauthorisedAccessException(
                    "Admin " + adminId + " is a founding member and cannot be deleted.");
        }
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminId));
        adminRepository.delete(admin);
        log.info("Admin removed: adminId={}", adminId);
    }

    @Transactional("oracleTransactionManager")
    public AdminResponse updateAdmin(String adminId, AddAdminRequest req) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminId));
        if (req.getFirstName() != null) admin.setAdminFirstName(req.getFirstName());
        if (req.getLastName()  != null) admin.setAdminLastName(req.getLastName());
        if (req.getEmail()     != null) admin.setAdminEmail(req.getEmail());
        if (req.getPhone()     != null) admin.setAdminPhoneNumber(req.getPhone());
        if (req.getUsername()  != null) admin.setAdminUsername(req.getUsername());
        Admin saved = adminRepository.save(admin);
        log.info("Admin updated: adminId={}", adminId);
        return toResponse(saved);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    // ── Photo retrieval ───────────────────────────────────────────────────────

    /**
     * Returns the raw BLOB bytes for an admin's biometric photo.
     * Returns null if no photo is stored.
     * Called by AdminController to serve /photos/:filename.
     */
    public byte[] getAdminPhoto(String adminId) {
        return adminRepository.findById(adminId)
                .map(Admin::getAdminBiometric)
                .orElse(null);
    }

    public AdminResponse toResponse(Admin admin) {
        String photoUrl = (admin.getAdminBiometric() != null && admin.getAdminBiometric().length > 0)
                ? PHOTO_BASE_URL + admin.getAdminFirstName() + ".jpg"
                : null;
        return AdminResponse.builder()
                .adminId(admin.getAdminId())
                .adminUsername(admin.getAdminUsername())
                .adminFirstName(admin.getAdminFirstName())
                .adminLastName(admin.getAdminLastName())
                .adminEmail(admin.getAdminEmail())
                .adminPhoneNumber(admin.getAdminPhoneNumber())
                .isProtected(PROTECTED_IDS.contains(admin.getAdminId()))
                .photoUrl(photoUrl)
                .build();
    }
}