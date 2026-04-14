package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.request.*;
import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(req)));
    }

    /** POST /api/auth/register/user */
    @PostMapping("/register/user")
    public ResponseEntity<ApiResponse> registerUser(@Valid @RequestBody RegisterUserRequest req) {
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", authService.registerUser(req)));
    }

    /** POST /api/auth/register/organiser */
    @PostMapping("/register/organiser")
    public ResponseEntity<ApiResponse> registerOrganiser(@Valid @RequestBody RegisterOrganiserRequest req) {
        authService.registerOrganiser(req);
        return ResponseEntity.ok(ApiResponse.success("Organiser application submitted. Pending admin approval."));
    }

    /** POST /api/auth/forgot-password */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to " + req.getEmail()));
    }

    /** POST /api/auth/verify-otp */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        authService.verifyOtp(req);
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully."));
    }

    /** POST /api/auth/reset-password */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully."));
    }

    /** POST /api/auth/send-otp — sends OTP for new registration (pre-signup verification) */
    /** POST /api/auth/send-otp — sends OTP for new registration (pre-signup verification) */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse> sendOtp(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.sendSignupOtp(req);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to " + req.getEmail()));
    }
}