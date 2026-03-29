// ─── LoginRequest.java ────────────────────────────────────────────────────────
package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest
{
    @NotBlank(message = "Role is required")
    private String role;

    @NotBlank(message = "Login mode is required")
    private String loginMode;

    @NotBlank(message = "Username or email is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}