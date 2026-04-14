package com.eventsphere.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * POST /api/bank/deduct
 *
 * Sent by frontend PaymentPage when user clicks Pay.
 *
 * method values: CARD | NETBANKING | UPI
 *
 * selectedProgrammeIds: the list of programme IDs the user ticked on
 *   EventDetailPage before navigating to PaymentPage. Sent in the payment
 *   body so BankService can increment seatsBooked for each programme on success.
 */
@Data
public class PaymentRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Amount must be at least ₹1")
    private BigDecimal amount;

    /** Links this payment to an event. Stored in Transaction.eventId. */
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

    /**
     * Programme IDs selected by user on EventDetailPage.
     * BankService increments seatsBooked in H2 ProgrammeMeta for each ID
     * on every successful payment, keeping the seat fill bar accurate.
     * Null or empty list is handled gracefully — seat tracking skipped.
     */
    private List<String> selectedProgrammeIds;
}