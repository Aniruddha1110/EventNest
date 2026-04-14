package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.UpdateUserRequest;
import com.eventsphere.backend.dto.response.UserResponse;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.UserRepository;
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
 * Unit tests for {@link UserService}.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User buildUser() {
        return User.builder()
                .userId("U-0001")
                .userFirstName("John")
                .userLastName("Doe")
                .userEmail("john@test.com")
                .userPhoneNo("9876543210")
                .userUsername("johndoe")
                .userPassword("hashedpw")
                .build();
    }

    @Test
    @DisplayName("getProfile() — found → returns UserResponse")
    void getProfile_found_returnsUserResponse() {
        when(userRepository.findById("U-0001")).thenReturn(Optional.of(buildUser()));

        UserResponse response = userService.getProfile("U-0001");

        assertEquals("U-0001", response.getUserId());
        assertEquals("John", response.getUserFirstName());
        assertEquals("Doe", response.getUserLastName());
        assertEquals("john@test.com", response.getUserEmail());
        assertEquals("johndoe", response.getUserUsername());
    }

    @Test
    @DisplayName("getProfile() — not found → throws ResourceNotFoundException")
    void getProfile_notFound_throws() {
        when(userRepository.findById("U-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.getProfile("U-9999"));
    }

    @Test
    @DisplayName("getAllUsers() returns list of UserResponse")
    void getAllUsers_returnsList() {
        when(userRepository.findAll()).thenReturn(List.of(buildUser()));

        List<UserResponse> users = userService.getAllUsers();

        assertEquals(1, users.size());
        assertEquals("U-0001", users.get(0).getUserId());
    }

    @Test
    @DisplayName("updateUser() updates non-null fields")
    void updateUser_updatesFields() {
        User user = buildUser();
        when(userRepository.findById("U-0001")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateUserRequest req = new UpdateUserRequest();
        req.setUserFirstName("Jane");
        req.setUserEmail("jane@test.com");

        UserResponse response = userService.updateUser("U-0001", req);

        assertEquals("Jane", response.getUserFirstName());
        assertEquals("jane@test.com", response.getUserEmail());
        assertEquals("Doe", response.getUserLastName()); // unchanged
    }

    @Test
    @DisplayName("updateUser() — not found → throws ResourceNotFoundException")
    void updateUser_notFound_throws() {
        when(userRepository.findById("U-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.updateUser("U-9999", new UpdateUserRequest()));
    }

    @Test
    @DisplayName("deleteUser() — success")
    void deleteUser_success() {
        User user = buildUser();
        when(userRepository.findById("U-0001")).thenReturn(Optional.of(user));

        assertDoesNotThrow(() -> userService.deleteUser("U-0001"));
        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("deleteUser() — not found → throws ResourceNotFoundException")
    void deleteUser_notFound_throws() {
        when(userRepository.findById("U-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> userService.deleteUser("U-9999"));
    }
}
