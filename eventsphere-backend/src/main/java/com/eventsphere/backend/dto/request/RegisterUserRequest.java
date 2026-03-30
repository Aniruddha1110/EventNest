package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterUserRequest
{
    @NotBlank(message = "First name is required")
    @Size(max = 25, message = "First name must be 25 characters or less")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 25, message = "Last name must be 25 characters or less")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    @Size(max = 32, message = "Email must be 32 characters or less (DB limit)")
    private String email;

    @Pattern(regexp = "^\\d{10}$", message = "Phone must be exactly 10 digits")
    private String phone;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 30, message = "Username must be 3–30 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}