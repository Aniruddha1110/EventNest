package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ProgrammeStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(
            regexp = "pending|approved|rejected|cancelled",
            message = "Status must be 'pending', 'approved', 'rejected', or 'cancelled'"
    )
    private String status;
}