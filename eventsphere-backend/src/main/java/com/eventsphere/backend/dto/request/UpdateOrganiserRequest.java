package com.eventsphere.backend.dto.request;

import lombok.Data;

@Data
public class UpdateOrganiserRequest {
    private String name;
    private String email;
    private String phone;
    private String username;
}