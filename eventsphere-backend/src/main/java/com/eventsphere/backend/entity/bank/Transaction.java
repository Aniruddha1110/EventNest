package com.eventsphere.backend.entity.bank;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "TRANSACTIONS")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class Transaction
{
    @Id
    @Column(name = "TXN_ID", length = 25, nullable = false)
    private String txnId;

    @Column(name = "USER_ID", length = 10, nullable = false)
    private String userId;

    @Column(name = "EVENT_ID", length = 5)
    private String eventId;

    @Column(name = "AMOUNT", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "TYPE", length = 10, nullable = false)
    private String type;

    @Column(name = "METHOD", length = 15, nullable = false)
    private String method;

    @Column(name = "STATUS", length = 10, nullable = false)
    private String status;

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
