package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class EventStatusRequest {

    @NotBlank(message = "Status is required")
    @Pattern(
            regexp = "upcoming|ongoing|completed",
            message = "Status must be 'upcoming', 'ongoing', or 'completed'"
    )
    private String status;
}