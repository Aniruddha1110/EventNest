package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.*;
import com.eventsphere.backend.dto.response.AuthResponse;
import com.eventsphere.backend.entity.Admin;
import com.eventsphere.backend.entity.Organiser;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.event.UserRegisteredEvent;
import com.eventsphere.backend.exception.DuplicateResourceException;
import com.eventsphere.backend.exception.InvalidCredentialsException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.AdminRepository;
import com.eventsphere.backend.repository.OrganiserRepository;
import com.eventsphere.backend.repository.UserRepository;
import com.eventsphere.backend.security.JwtUtil;
import com.eventsphere.backend.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication service — handles all login, registration, and password-reset logic.
 *
 * PASSWORD RULE (locked in forever):
 *   SHA-256 + UTF-8 + no salt → 64-char lowercase hex
 *   PasswordUtil.hash() and PasswordUtil.matches() implement this.
 *   NEVER change this algorithm — it breaks every stored password.
 *
 * ── Admin login is now TWO phases ─────────────────────────────────────────────
 *
 * Phase 1 — loginAdmin() (this file):
 *   Verifies username/password against Oracle ADMINS table.
 *   On success: returns AuthResponse with tempToken + facePending=true.
 *   NO real JWT is issued yet.
 *
 * Phase 2 — FaceAuthService (separate service):
 *   Receives tempToken + webcam image from frontend.
 *   Verifies face against ADMIN_BIOMETRIC BLOB from Oracle.
 *   On success: issues real JWT with role="admin".
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository       userRepository;
    private final OrganiserRepository  organiserRepository;
    private final AdminRepository      adminRepository;
    private final JwtUtil              jwtUtil;
    private final OtpService           otpService;
    private final MailService          mailService;
    private final ApplicationEventPublisher eventPublisher;

    // ── Login ─────────────────────────────────────────────────────────────────

    /**
     * Handles login for all three roles (user / organiser / admin).
     * loginMode = "username" → find by username
     * loginMode = "email"    → find by email
     *
     * Admin login returns facePending=true + tempToken (NOT a real JWT).
     * User/Organiser login returns the real JWT as before.
     */
    public AuthResponse login(LoginRequest req) {
        String role      = req.getRole().toLowerCase();
        String mode      = req.getLoginMode();
        String id        = req.getIdentifier();
        String plainPass = req.getPassword();

        return switch (role) {
            case "user"      -> loginUser(mode, id, plainPass);
            case "organiser" -> loginOrganiser(mode, id, plainPass);
            case "admin"     -> loginAdmin(mode, id, plainPass);
            default          -> throw new InvalidCredentialsException("Unknown role: " + role);
        };
    }

    private AuthResponse loginUser(String mode, String id, String plainPass) {
        User user = "email".equals(mode)
                ? userRepository.findByUserEmailIgnoreCase(id)
                .orElseThrow(() -> new InvalidCredentialsException("No user found with that email."))
                : userRepository.findByUserUsername(id)
                .orElseThrow(() -> new InvalidCredentialsException("No user found with that username."));

        if (!PasswordUtil.matches(plainPass, user.getUserPassword())) {
            throw new InvalidCredentialsException("Incorrect password.");
        }
        String token = jwtUtil.generateToken(user.getUserId(), "user");
        log.info("User login: userId={}", user.getUserId());
        return AuthResponse.builder()
                .token(token).role("user")
                .userId(user.getUserId())
                .name(user.getUserFirstName() + " " + user.getUserLastName())
                .email(user.getUserEmail())
                .facePending(false)
                .build();
    }

    private AuthResponse loginOrganiser(String mode, String id, String plainPass) {
        Organiser org = "email".equals(mode)
                ? organiserRepository.findByOrganiserEmailIgnoreCase(id)
                .orElseThrow(() -> new InvalidCredentialsException("No organiser found with that email."))
                : organiserRepository.findByOrganiserUsername(id)
                .orElseThrow(() -> new InvalidCredentialsException("No organiser found with that username."));

        if (!PasswordUtil.matches(plainPass, org.getOrganiserPassword())) {
            throw new InvalidCredentialsException("Incorrect password.");
        }
        String token = jwtUtil.generateToken(org.getOrganiserId(), "organiser");
        log.info("Organiser login: organiserId={}", org.getOrganiserId());
        return AuthResponse.builder()
                .token(token).role("organiser")
                .userId(org.getOrganiserId())
                .name(org.getOrganiserName())
                .email(org.getOrganiserEmail())
                .facePending(false)
                .build();
    }

    /**
     * Admin Phase 1 — password verification only.
     *
     * Returns a TEMP token (role=admin_pending, TTL=3min) + facePending=true.
     * The frontend must navigate to /face-auth and complete Phase 2.
     * NO real JWT is issued here — the admin cannot access any protected
     * route until face recognition passes.
     */
    private AuthResponse loginAdmin(String mode, String id, String plainPass) {
        Admin admin = "email".equals(mode)
                ? adminRepository.findByAdminEmailIgnoreCase(id)
                .orElseThrow(() -> new InvalidCredentialsException("No admin found with that email."))
                : adminRepository.findByAdminUsername(id)
                .orElseThrow(() -> new InvalidCredentialsException("No admin found with that username."));

        if (!PasswordUtil.matches(plainPass, admin.getAdminPassword())) {
            throw new InvalidCredentialsException("Incorrect password.");
        }

        // Phase 1 passed — issue TEMP token only
        String tempToken = jwtUtil.generateTempToken(admin.getAdminId());
        String photoUrl  = "/photos/" + admin.getAdminFirstName() + ".jpg";

        log.info("Admin Phase 1 passed: adminId={} — awaiting face verification.", admin.getAdminId());

        return AuthResponse.builder()
                .token(null)              // No real JWT yet
                .tempToken(tempToken)     // Short-lived, face_pending=true
                .role("admin_pending")
                .userId(admin.getAdminId())
                .name(admin.getAdminFirstName() + " " + admin.getAdminLastName())
                .email(admin.getAdminEmail())
                .photoUrl(photoUrl)
                .facePending(true)        // Frontend checks this flag
                .build();
    }

    // ── Register User ─────────────────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public AuthResponse registerUser(RegisterUserRequest req) {
        if (userRepository.existsByUserEmail(req.getEmail()))
            throw new DuplicateResourceException("An account with this email already exists.");
        if (userRepository.existsByUserUsername(req.getUsername()))
            throw new DuplicateResourceException("This username is already taken.");

        User user = User.builder()
                .userFirstName(req.getFirstName())
                .userLastName(req.getLastName())
                .userEmail(req.getEmail())
                .userPhoneNo(req.getPhone())
                .userUsername(req.getUsername())
                .userPassword(PasswordUtil.hash(req.getPassword()))
                .build();

        User saved = userRepository.save(user);
        eventPublisher.publishEvent(new UserRegisteredEvent(this, saved));

        String token = jwtUtil.generateToken(saved.getUserId(), "user");
        log.info("User registered: userId={}", saved.getUserId());
        return AuthResponse.builder()
                .token(token).role("user")
                .userId(saved.getUserId())
                .name(saved.getUserFirstName() + " " + saved.getUserLastName())
                .email(saved.getUserEmail())
                .facePending(false)
                .build();
    }

    // ── Register Organiser ────────────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public void registerOrganiser(RegisterOrganiserRequest req) {
        if (organiserRepository.existsByOrganiserEmail(req.getEmail()))
            throw new DuplicateResourceException("An account with this email already exists.");
        if (organiserRepository.existsByOrganiserUsername(req.getUsername()))
            throw new DuplicateResourceException("This username is already taken.");

        Organiser org = Organiser.builder()
                .organiserName(req.getName())
                .organiserEmail(req.getEmail())
                .organiserPhoneNo(req.getPhone())
                .organiserUsername(req.getUsername())
                .organiserPassword(PasswordUtil.hash(req.getPassword()))
                .build();

        organiserRepository.save(org);
        log.info("Organiser registered: username={}", req.getUsername());
    }

    // ── Forgot Password → send OTP ────────────────────────────────────────────

    public void forgotPassword(ForgotPasswordRequest req) {
        verifyEmailExists(req.getEmail(), req.getRole());
        String otp = otpService.generateAndStore(req.getEmail());
        mailService.sendOtp(req.getEmail(), otp);
        log.info("OTP sent to email={}", req.getEmail());
    }

    // ── Verify OTP ────────────────────────────────────────────────────────────

    public void verifyOtp(VerifyOtpRequest req) {
        if (!otpService.verify(req.getEmail(), req.getOtp())) {
            throw new InvalidCredentialsException("OTP is incorrect or has expired.");
        }
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    @Transactional("oracleTransactionManager")
    public void resetPassword(ResetPasswordRequest req) {
        if (!otpService.verify(req.getEmail(), req.getOtp())) {
            throw new InvalidCredentialsException("OTP is incorrect or has expired.");
        }

        String newHash = PasswordUtil.hash(req.getNewPassword());

        switch (req.getRole().toLowerCase()) {
            case "user" -> {
                User user = userRepository.findByUserEmailIgnoreCase(req.getEmail())
                        .orElseThrow(() -> new ResourceNotFoundException("User not found."));
                user.setUserPassword(newHash);
                userRepository.save(user);
            }
            case "organiser" -> {
                Organiser org = organiserRepository.findByOrganiserEmailIgnoreCase(req.getEmail())
                        .orElseThrow(() -> new ResourceNotFoundException("Organiser not found."));
                org.setOrganiserPassword(newHash);
                organiserRepository.save(org);
            }
            case "admin" -> {
                Admin admin = adminRepository.findByAdminEmailIgnoreCase(req.getEmail())
                        .orElseThrow(() -> new ResourceNotFoundException("Admin not found."));
                admin.setAdminPassword(newHash);
                adminRepository.save(admin);
            }
            default -> throw new InvalidCredentialsException("Unknown role: " + req.getRole());
        }

        otpService.clearOtp(req.getEmail());
        log.info("Password reset for email={}, role={}", req.getEmail(), req.getRole());
    }

    // ── Send signup OTP ───────────────────────────────────────────────────────

    public void sendSignupOtp(ForgotPasswordRequest req) {
        String otp = otpService.generateAndStore(req.getEmail());
        mailService.sendOtp(req.getEmail(), otp);
        log.info("Signup OTP sent to email={}", req.getEmail());
    }

    // ── Private helper ────────────────────────────────────────────────────────

    private void verifyEmailExists(String email, String role) {
        boolean exists = switch (role.toLowerCase()) {
            case "user"      -> userRepository.findByUserEmailIgnoreCase(email).isPresent();
            case "organiser" -> organiserRepository.findByOrganiserEmailIgnoreCase(email).isPresent();
            case "admin"     -> adminRepository.findByAdminEmailIgnoreCase(email).isPresent();
            default          -> false;
        };
        if (!exists) {
            throw new ResourceNotFoundException("No " + role + " account found with email: " + email);
        }
    }
}