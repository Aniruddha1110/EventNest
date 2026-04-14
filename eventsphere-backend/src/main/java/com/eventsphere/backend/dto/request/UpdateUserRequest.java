package com.eventsphere.backend.dto.request;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String userFirstName;
    private String userLastName;
    private String userEmail;
    private String userPhoneNo;
    private String userUsername;
}