package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least ₹1")
    private BigDecimal amount;

    private String eventId;

    @NotBlank(message = "Payment method is required")
    private String method;

    // ── CARD fields ────────────────────────────────────────────────────────────
    private String cardNumber;

    private String cvv;

    private String expiry;

    private String cardHolderName;

    // ── NET BANKING fields ─────────────────────────────────────────────────────
    private String netBankingId;

    private String netBankingPw;

    // ── UPI fields ─────────────────────────────────────────────────────────────
    private String upiId;
}