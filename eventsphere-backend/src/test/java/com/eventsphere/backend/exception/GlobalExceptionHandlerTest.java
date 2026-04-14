package com.eventsphere.backend.exception;

import com.eventsphere.backend.dto.response.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link GlobalExceptionHandler}.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("ResourceNotFoundException → 404 NOT_FOUND")
    void handleNotFound_returns404() {
        ResourceNotFoundException ex = new ResourceNotFoundException("User not found: U-0001");

        ResponseEntity<ApiResponse> response = handler.handleNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("User not found: U-0001", response.getBody().getMessage());
    }

    @Test
    @DisplayName("DuplicateResourceException → 409 CONFLICT")
    void handleDuplicate_returns409() {
        DuplicateResourceException ex = new DuplicateResourceException("Email already exists");

        ResponseEntity<ApiResponse> response = handler.handleDuplicate(ex);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Email already exists", response.getBody().getMessage());
    }

    @Test
    @DisplayName("InvalidCredentialsException → 401 UNAUTHORIZED")
    void handleInvalidCredentials_returns401() {
        InvalidCredentialsException ex = new InvalidCredentialsException("Incorrect password");

        ResponseEntity<ApiResponse> response = handler.handleInvalidCredentials(ex);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Incorrect password", response.getBody().getMessage());
    }

    @Test
    @DisplayName("PaymentFailedException → 402 PAYMENT_REQUIRED")
    void handlePaymentFailed_returns402() {
        PaymentFailedException ex = new PaymentFailedException("Insufficient balance");

        ResponseEntity<ApiResponse> response = handler.handlePaymentFailed(ex);

        assertEquals(HttpStatus.PAYMENT_REQUIRED, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Insufficient balance", response.getBody().getMessage());
    }

    @Test
    @DisplayName("UnauthorisedAccessException → 403 FORBIDDEN")
    void handleUnauthorised_returns403() {
        UnauthorisedAccessException ex = new UnauthorisedAccessException("Admin A-0001 cannot be deleted");

        ResponseEntity<ApiResponse> response = handler.handleUnauthorised(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("Admin A-0001 cannot be deleted", response.getBody().getMessage());
    }

    @Test
    @DisplayName("Generic Exception → 500 INTERNAL_SERVER_ERROR")
    void handleGeneric_returns500() {
        Exception ex = new RuntimeException("Something went wrong");

        ResponseEntity<ApiResponse> response = handler.handleGeneric(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertFalse(response.getBody().isSuccess());
        assertEquals("An unexpected error occurred. Please try again.", response.getBody().getMessage());
    }
}
