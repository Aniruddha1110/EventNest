package com.eventsphere.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ORGANISERS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organiser
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ORGANISER_ID")
    private String organiserId;

    @Column(name = "ORGANISER_NAME", length = 50, nullable = false)
    private String organiserName;

    @Column(name = "ORGANISER_EMAIL", length = 32, nullable = false, unique = true)
    private String organiserEmail;

    @Column(name = "ORGANISER_PHONENO", length = 10)
    private String organiserPhoneNo;

    @Column(name = "ORGANISER_USERNAME", length = 30, nullable = false, unique = true)
    private String organiserUsername;

    @Column(name = "ORGANISER_PASSWORD", length = 64, nullable = false)
    private String organiserPassword;
}