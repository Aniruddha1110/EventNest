package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private String        txnId;
    private String        userId;
    private String        eventId;
    private BigDecimal    amount;

    private String        type;

    private String        method;

    private String        status;

    private LocalDateTime createdAt;

    private String        failureReason;
}