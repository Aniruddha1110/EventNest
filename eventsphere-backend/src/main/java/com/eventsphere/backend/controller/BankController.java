package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.request.PaymentRequest;
import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.BankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Bank controller — H2 fake bank operations.
 *
 * Endpoints:
 *   GET  /api/bank/account             → logged-in user's bank account details
 *   POST /api/bank/deduct              → process a payment (CARD/UPI/NETBANKING)
 *   GET  /api/bank/transactions        → full transaction history
 *
 * All endpoints require ROLE_USER JWT.
 * userId is always read from the JWT (auth.getName()), never from a request param.
 * The userId in PaymentRequest.userId must match the JWT userId —
 * enforced in BankService so a user cannot pay from another user's account.
 */
@RestController
@RequestMapping("/api/bank")
@RequiredArgsConstructor
public class BankController {

    private final BankService bankService;

    /**
     * GET /api/bank/account
     *
     * Returns the H2 bank account for the logged-in user.
     * Used by PaymentPage to show masked card number, balance, bank name.
     * CVV and netBankingPw are NEVER returned.
     */
    @GetMapping("/account")
    public ResponseEntity<ApiResponse> getAccount(Authentication auth) {
        return ResponseEntity.ok(
                ApiResponse.success("Bank account fetched",
                        bankService.getAccount(auth.getName())));
    }

    /**
     * POST /api/bank/deduct
     *
     * Processes a payment. Body is PaymentRequest which includes method,
     * card/UPI/netbanking credentials, amount, and eventId.
     *
     * Returns TransactionResponse with status SUCCESS or FAILED.
     * On FAILED, HTTP 402 is returned with a failureReason string.
     * PaymentPage reads response.data.status to navigate to ticket or failure screen.
     */
    @PostMapping("/deduct")
    public ResponseEntity<ApiResponse> processPayment(
            @Valid @RequestBody PaymentRequest req,
            Authentication auth) {

        // Security guard: always use JWT userId, never trust the request body userId
        req.setUserId(auth.getName());

        return ResponseEntity.ok(
                ApiResponse.success("Payment processed",
                        bankService.processPayment(req)));
    }

    /**
     * GET /api/bank/transactions
     *
     * Full transaction history for the logged-in user, newest first.
     * Used by TicketHistory page.
     */
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse> getTransactions(Authentication auth) {
        return ResponseEntity.ok(
                ApiResponse.success("Transactions fetched",
                        bankService.getTransactions(auth.getName())));
    }
}