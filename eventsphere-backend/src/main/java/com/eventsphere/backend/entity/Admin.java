package com.eventsphere.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "ADMINS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ADMIN_ID")
    private String adminId;

    @Column(name = "ADMIN_USERNAME", length = 50, nullable = false, unique = true)
    private String adminUsername;

    @Column(name = "ADMIN_PASSWORD", length = 64, nullable = false)
    private String adminPassword;

    @Column(name = "ADMIN_FIRST_NAME", length = 50, nullable = false)
    private String adminFirstName;

    @Column(name = "ADMIN_LAST_NAME", length = 50, nullable = false)
    private String adminLastName;

    @Column(name = "ADMIN_EMAIL", length = 40, nullable = false, unique = true)
    private String adminEmail;

    @Column(name = "ADMIN_PHONE_NUMBER", length = 10)
    private String adminPhoneNumber;

    @Lob
    @Column(name = "ADMIN_BIOMETRIC")
    @Basic(fetch = FetchType.LAZY)
    private byte[] adminBiometric;

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}