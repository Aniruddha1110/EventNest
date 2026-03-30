package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccountResponse {

    private String     userId;
    private String     cardHolder;
    private String     expiry;
    private BigDecimal balance;
    private String     upiId;
    private String     netBankingId;
    private String     bankName;

    private String maskedCardNumber;
}