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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link AuthService}.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository       userRepository;
    @Mock private OrganiserRepository  organiserRepository;
    @Mock private AdminRepository      adminRepository;
    @Mock private JwtUtil              jwtUtil;
    @Mock private OtpService           otpService;
    @Mock private MailService          mailService;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AuthService authService;

    // ── Test fixtures ─────────────────────────────────────────────────────────

    private User buildUser() {
        return User.builder()
                .userId("U-0001")
                .userFirstName("John")
                .userLastName("Doe")
                .userEmail("john@test.com")
                .userUsername("johndoe")
                .userPassword(PasswordUtil.hash("password123"))
                .build();
    }

    private Organiser buildOrganiser() {
        return Organiser.builder()
                .organiserId("O-0001")
                .organiserName("TestOrg")
                .organiserEmail("org@test.com")
                .organiserUsername("testorg")
                .organiserPassword(PasswordUtil.hash("password123"))
                .build();
    }

    private Admin buildAdmin() {
        return Admin.builder()
                .adminId("A-0001")
                .adminFirstName("Admin")
                .adminLastName("User")
                .adminEmail("admin@test.com")
                .adminUsername("adminuser")
                .adminPassword(PasswordUtil.hash("password123"))
                .build();
    }

    private LoginRequest loginReq(String role, String mode, String id, String password) {
        LoginRequest req = new LoginRequest();
        req.setRole(role);
        req.setLoginMode(mode);
        req.setIdentifier(id);
        req.setPassword(password);
        return req;
    }

    // ── Login Tests ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Login")
    class LoginTests {

        @Test
        @DisplayName("User login by username — success")
        void loginUser_byUsername_success() {
            User user = buildUser();
            when(userRepository.findByUserUsername("johndoe")).thenReturn(Optional.of(user));
            when(jwtUtil.generateToken("U-0001", "user")).thenReturn("jwt-token");

            AuthResponse response = authService.login(loginReq("user", "username", "johndoe", "password123"));

            assertEquals("jwt-token", response.getToken());
            assertEquals("user", response.getRole());
            assertEquals("U-0001", response.getUserId());
            assertEquals("John Doe", response.getName());
        }

        @Test
        @DisplayName("User login by email — success")
        void loginUser_byEmail_success() {
            User user = buildUser();
            when(userRepository.findByUserEmailIgnoreCase("john@test.com")).thenReturn(Optional.of(user));
            when(jwtUtil.generateToken("U-0001", "user")).thenReturn("jwt-token");

            AuthResponse response = authService.login(loginReq("user", "email", "john@test.com", "password123"));

            assertEquals("jwt-token", response.getToken());
            assertEquals("john@test.com", response.getEmail());
        }

        @Test
        @DisplayName("User login — wrong password → throws InvalidCredentialsException")
        void loginUser_wrongPassword_throwsInvalidCredentials() {
            User user = buildUser();
            when(userRepository.findByUserUsername("johndoe")).thenReturn(Optional.of(user));

            assertThrows(InvalidCredentialsException.class,
                    () -> authService.login(loginReq("user", "username", "johndoe", "wrongpass")));
        }

        @Test
        @DisplayName("User login — not found → throws InvalidCredentialsException")
        void loginUser_notFound_throwsInvalidCredentials() {
            when(userRepository.findByUserUsername("nonexistent")).thenReturn(Optional.empty());

            assertThrows(InvalidCredentialsException.class,
                    () -> authService.login(loginReq("user", "username", "nonexistent", "any")));
        }

        @Test
        @DisplayName("Organiser login — success")
        void loginOrganiser_success() {
            Organiser org = buildOrganiser();
            when(organiserRepository.findByOrganiserUsername("testorg")).thenReturn(Optional.of(org));
            when(jwtUtil.generateToken("O-0001", "organiser")).thenReturn("org-token");

            AuthResponse response = authService.login(loginReq("organiser", "username", "testorg", "password123"));

            assertEquals("org-token", response.getToken());
            assertEquals("organiser", response.getRole());
        }

        @Test
        @DisplayName("Admin login — success with photoUrl")
        void loginAdmin_success() {
            Admin admin = buildAdmin();
            when(adminRepository.findByAdminUsername("adminuser")).thenReturn(Optional.of(admin));
            when(jwtUtil.generateToken("A-0001", "admin")).thenReturn("admin-token");

            AuthResponse response = authService.login(loginReq("admin", "username", "adminuser", "password123"));

            assertEquals("admin-token", response.getToken());
            assertEquals("admin", response.getRole());
            assertNotNull(response.getPhotoUrl());
            assertTrue(response.getPhotoUrl().contains("Admin"));
        }

        @Test
        @DisplayName("Unknown role → throws InvalidCredentialsException")
        void login_unknownRole_throws() {
            assertThrows(InvalidCredentialsException.class,
                    () -> authService.login(loginReq("superuser", "username", "any", "any")));
        }
    }

    // ── Register Tests ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Register")
    class RegisterTests {

        @Test
        @DisplayName("Register user — success returns AuthResponse with token")
        void registerUser_success_returnsAuthResponse() {
            RegisterUserRequest req = new RegisterUserRequest();
            req.setFirstName("Jane");
            req.setLastName("Doe");
            req.setEmail("jane@test.com");
            req.setPhone("1234567890");
            req.setUsername("janedoe");
            req.setPassword("password123");

            when(userRepository.existsByUserEmail("jane@test.com")).thenReturn(false);
            when(userRepository.existsByUserUsername("janedoe")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> {
                User u = inv.getArgument(0);
                u.setUserId("U-0002");
                return u;
            });
            when(jwtUtil.generateToken("U-0002", "user")).thenReturn("new-token");

            AuthResponse response = authService.registerUser(req);

            assertEquals("new-token", response.getToken());
            assertEquals("user", response.getRole());
            assertEquals("U-0002", response.getUserId());
            verify(eventPublisher).publishEvent(any(UserRegisteredEvent.class));
        }

        @Test
        @DisplayName("Register user — duplicate email → throws DuplicateResourceException")
        void registerUser_duplicateEmail_throwsDuplicate() {
            RegisterUserRequest req = new RegisterUserRequest();
            req.setEmail("existing@test.com");
            req.setUsername("newuser");

            when(userRepository.existsByUserEmail("existing@test.com")).thenReturn(true);

            assertThrows(DuplicateResourceException.class,
                    () -> authService.registerUser(req));
        }

        @Test
        @DisplayName("Register user — duplicate username → throws DuplicateResourceException")
        void registerUser_duplicateUsername_throwsDuplicate() {
            RegisterUserRequest req = new RegisterUserRequest();
            req.setEmail("new@test.com");
            req.setUsername("existinguser");

            when(userRepository.existsByUserEmail("new@test.com")).thenReturn(false);
            when(userRepository.existsByUserUsername("existinguser")).thenReturn(true);

            assertThrows(DuplicateResourceException.class,
                    () -> authService.registerUser(req));
        }

        @Test
        @DisplayName("Register organiser — success, no token returned")
        void registerOrganiser_success_noTokenReturned() {
            RegisterOrganiserRequest req = new RegisterOrganiserRequest();
            req.setName("NewOrg");
            req.setEmail("neworg@test.com");
            req.setPhone("9876543210");
            req.setUsername("neworg");
            req.setPassword("password123");

            when(organiserRepository.existsByOrganiserEmail("neworg@test.com")).thenReturn(false);
            when(organiserRepository.existsByOrganiserUsername("neworg")).thenReturn(false);
            when(organiserRepository.save(any(Organiser.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> authService.registerOrganiser(req));
            verify(organiserRepository).save(any(Organiser.class));
        }

        @Test
        @DisplayName("Register organiser — duplicate email → throws")
        void registerOrganiser_duplicateEmail_throws() {
            RegisterOrganiserRequest req = new RegisterOrganiserRequest();
            req.setEmail("existing@test.com");
            req.setUsername("neworg");

            when(organiserRepository.existsByOrganiserEmail("existing@test.com")).thenReturn(true);

            assertThrows(DuplicateResourceException.class,
                    () -> authService.registerOrganiser(req));
        }
    }

    // ── Forgot / OTP / Reset Tests ────────────────────────────────────────────

    @Nested
    @DisplayName("Forgot Password / OTP / Reset")
    class ForgotPasswordTests {

        @Test
        @DisplayName("forgotPassword — sends OTP when email exists")
        void forgotPassword_sendsOtp() {
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("john@test.com");
            req.setRole("user");

            when(userRepository.findByUserEmailIgnoreCase("john@test.com"))
                    .thenReturn(Optional.of(buildUser()));
            when(otpService.generateAndStore("john@test.com")).thenReturn("123456");

            assertDoesNotThrow(() -> authService.forgotPassword(req));
            verify(mailService).sendOtp("john@test.com", "123456");
        }

        @Test
        @DisplayName("forgotPassword — email not found → throws ResourceNotFoundException")
        void forgotPassword_emailNotFound_throws() {
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("nobody@test.com");
            req.setRole("user");

            when(userRepository.findByUserEmailIgnoreCase("nobody@test.com"))
                    .thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> authService.forgotPassword(req));
        }

        @Test
        @DisplayName("verifyOtp — correct OTP → no exception")
        void verifyOtp_correct_noException() {
            VerifyOtpRequest req = new VerifyOtpRequest();
            req.setEmail("john@test.com");
            req.setOtp("123456");

            when(otpService.verify("john@test.com", "123456")).thenReturn(true);

            assertDoesNotThrow(() -> authService.verifyOtp(req));
        }

        @Test
        @DisplayName("verifyOtp — incorrect OTP → throws InvalidCredentialsException")
        void verifyOtp_incorrect_throwsInvalidCredentials() {
            VerifyOtpRequest req = new VerifyOtpRequest();
            req.setEmail("john@test.com");
            req.setOtp("000000");

            when(otpService.verify("john@test.com", "000000")).thenReturn(false);

            assertThrows(InvalidCredentialsException.class,
                    () -> authService.verifyOtp(req));
        }

        @Test
        @DisplayName("resetPassword — success for user, clears OTP")
        void resetPassword_success_clearsOtp() {
            ResetPasswordRequest req = new ResetPasswordRequest();
            req.setEmail("john@test.com");
            req.setOtp("123456");
            req.setNewPassword("newPassword123");
            req.setRole("user");

            when(otpService.verify("john@test.com", "123456")).thenReturn(true);
            when(userRepository.findByUserEmailIgnoreCase("john@test.com"))
                    .thenReturn(Optional.of(buildUser()));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> authService.resetPassword(req));
            verify(otpService).clearOtp("john@test.com");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("resetPassword — invalid OTP → throws InvalidCredentialsException")
        void resetPassword_invalidOtp_throws() {
            ResetPasswordRequest req = new ResetPasswordRequest();
            req.setEmail("john@test.com");
            req.setOtp("000000");
            req.setNewPassword("newPassword123");
            req.setRole("user");

            when(otpService.verify("john@test.com", "000000")).thenReturn(false);

            assertThrows(InvalidCredentialsException.class,
                    () -> authService.resetPassword(req));
        }

        @Test
        @DisplayName("sendSignupOtp — sends OTP without verifying email exists")
        void sendSignupOtp_sendsOtpWithoutEmailCheck() {
            ForgotPasswordRequest req = new ForgotPasswordRequest();
            req.setEmail("new@test.com");
            req.setRole("user");

            when(otpService.generateAndStore("new@test.com")).thenReturn("654321");

            assertDoesNotThrow(() -> authService.sendSignupOtp(req));
            verify(mailService).sendOtp("new@test.com", "654321");
            // No repository call since it's a new signup
            verify(userRepository, never()).findByUserEmailIgnoreCase(anyString());
        }
    }
}
