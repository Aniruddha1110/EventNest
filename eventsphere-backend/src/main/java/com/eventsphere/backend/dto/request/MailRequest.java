package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class MailRequest {

    @NotBlank(message = "Target is required")
    private String target;

    @NotBlank(message = "Mode is required")
    private String mode;

    private List<String> recipients;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Body is required")
    private String body;
}