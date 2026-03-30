package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminResponse {

    private String  adminId;
    private String  adminUsername;
    private String  adminFirstName;
    private String  adminLastName;
    private String  adminEmail;
    private String  adminPhoneNumber;
    private boolean isProtected;
    private String  photoUrl;
}