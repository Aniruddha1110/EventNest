package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganiserResponse {

    private String organiserId;
    private String organiserName;
    private String organiserEmail;
    private String organiserPhoneNo;
    private String organiserUsername;
}