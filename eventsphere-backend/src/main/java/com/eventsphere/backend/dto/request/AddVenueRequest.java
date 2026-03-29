package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddVenueRequest {

    @NotBlank(message = "Venue name is required")
    @Size(max = 50, message = "Venue name must be 50 characters or less")
    private String venueName;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer venueCapacity;

    @Pattern(regexp = "^[YN]$", message = "Availability must be 'Y' or 'N'")
    private String venueAvailability;
}