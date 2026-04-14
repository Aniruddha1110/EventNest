package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.PaymentRequest;
import com.eventsphere.backend.dto.response.BankAccountResponse;
import com.eventsphere.backend.dto.response.TransactionResponse;
import com.eventsphere.backend.entity.bank.BankAccount;
import com.eventsphere.backend.entity.bank.Transaction;
import com.eventsphere.backend.exception.PaymentFailedException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.ProgrammeRepository;
import com.eventsphere.backend.repository.bank.BankAccountRepository;
import com.eventsphere.backend.repository.bank.TransactionRepository;
import com.eventsphere.backend.repository.h2.ProgrammeMetaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * Bank service — validates payment details against H2 and records transactions.
 *
 * CARD:        validates cardNumber + cvv + expiry exactly against H2 BankAccount.
 * NETBANKING:  validates netBankingId + netBankingPw exactly.
 * UPI:         validates format (@). 80% success / 20% random failure.
 *
 * On every SUCCESSFUL payment:
 *   1. Deducts amount from BankAccount.balance
 *   2. Saves Transaction (status = SUCCESS)
 *   3. Increments seatsBooked in ProgrammeMeta for each selected programme
 *      so the seat fill bar on EventDetailPage reflects real bookings.
 *
 * On FAILURE:
 *   1. Saves Transaction (status = FAILED), balance unchanged
 *   2. Throws PaymentFailedException (HTTP 402) with failure reason
 *
 * PaymentRequest.selectedProgrammeIds: list of programme IDs the user
 * selected on EventDetailPage. BankService increments each one's seatsBooked.
 * If this list is null or empty, seats are not incremented (free events with
 * no seat tracking, or PaymentPage didn't send the list).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BankService {

    private final BankAccountRepository  bankAccountRepository;
    private final TransactionRepository  transactionRepository;
    private final ProgrammeMetaRepository programmeMetaRepository;
    private final Random                 random = new Random();

    // ── Get account ───────────────────────────────────────────────────────────

    public BankAccountResponse getAccount(String userId) {
        BankAccount acc = bankAccountRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No bank account found for userId=" + userId));
        return toAccountResponse(acc);
    }

    // ── Process payment ───────────────────────────────────────────────────────

    @Transactional("h2TransactionManager")
    public TransactionResponse processPayment(PaymentRequest req) {
        BankAccount acc = bankAccountRepository.findByUserId(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No bank account for userId=" + req.getUserId()));

        String method = req.getMethod().toUpperCase();

        return switch (method) {
            case "CARD"       -> processCard(req, acc);
            case "NETBANKING" -> processNetBanking(req, acc);
            case "UPI"        -> processUpi(req, acc);
            default           -> throw new PaymentFailedException(
                    "Unknown payment method: " + method);
        };
    }

    // ── Transaction history ───────────────────────────────────────────────────

    public List<TransactionResponse> getTransactions(String userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toTxnResponse).toList();
    }

    // ── CARD ──────────────────────────────────────────────────────────────────

    private TransactionResponse processCard(PaymentRequest req, BankAccount acc) {
        String cleanInput  = req.getCardNumber() != null
                ? req.getCardNumber().replace(" ", "") : "";
        String cleanStored = acc.getCardNumber().replace(" ", "");

        if (!cleanInput.equals(cleanStored))
            return recordAndThrow(req, acc, "CARD", "Card number does not match our records.");
        if (!req.getCvv().equals(acc.getCvv()))
            return recordAndThrow(req, acc, "CARD", "Incorrect CVV.");
        if (!req.getExpiry().equals(acc.getExpiry()))
            return recordAndThrow(req, acc, "CARD", "Card has expired or expiry is incorrect.");
        if (acc.getBalance().compareTo(req.getAmount()) < 0)
            return recordAndThrow(req, acc, "CARD", "Insufficient balance.");

        return recordSuccess(req, acc, "CARD");
    }

    // ── NET BANKING ───────────────────────────────────────────────────────────

    private TransactionResponse processNetBanking(PaymentRequest req, BankAccount acc) {
        if (!req.getNetBankingId().equals(acc.getNetBankingId()))
            return recordAndThrow(req, acc, "NETBANKING", "Net Banking user ID does not match.");
        if (!req.getNetBankingPw().equals(acc.getNetBankingPw()))
            return recordAndThrow(req, acc, "NETBANKING", "Net Banking password is incorrect.");
        if (acc.getBalance().compareTo(req.getAmount()) < 0)
            return recordAndThrow(req, acc, "NETBANKING", "Insufficient balance.");

        return recordSuccess(req, acc, "NETBANKING");
    }

    // ── UPI ───────────────────────────────────────────────────────────────────

    private TransactionResponse processUpi(PaymentRequest req, BankAccount acc) {
        if (req.getUpiId() == null || !req.getUpiId().contains("@"))
            return recordAndThrow(req, acc, "UPI", "Invalid UPI ID format.");
        if (acc.getBalance().compareTo(req.getAmount()) < 0)
            return recordAndThrow(req, acc, "UPI", "Insufficient balance.");
        if (random.nextDouble() < 0.20)
            return recordAndThrow(req, acc, "UPI", "UPI payment timed out. Please try again.");

        return recordSuccess(req, acc, "UPI");
    }

    // ── Record success ────────────────────────────────────────────────────────

    private TransactionResponse recordSuccess(PaymentRequest req,
                                              BankAccount acc,
                                              String method) {
        // Deduct balance
        acc.setBalance(acc.getBalance().subtract(req.getAmount()));
        bankAccountRepository.save(acc);

        // Save transaction record
        Transaction txn = Transaction.builder()
                .txnId(generateTxnId())
                .userId(req.getUserId())
                .eventId(req.getEventId())
                .amount(req.getAmount())
                .type("DEBIT")
                .method(method)
                .status("SUCCESS")
                .build();
        transactionRepository.save(txn);

        // ── Increment seat counts for each selected programme ─────────────────
        // PaymentRequest.selectedProgrammeIds is the list the user selected
        // on EventDetailPage before clicking Pay. Null-safe — if the field
        // is absent (free event or not sent by frontend), skip silently.
        if (req.getSelectedProgrammeIds() != null
                && !req.getSelectedProgrammeIds().isEmpty()) {
            for (String progId : req.getSelectedProgrammeIds()) {
                try {
                    programmeMetaRepository.incrementSeatsBooked(progId);
                } catch (Exception e) {
                    // Log but don't fail the payment if seat tracking fails
                    log.warn("Seat increment failed for programmeId={}: {}", progId, e.getMessage());
                }
            }
            log.info("Seats incremented for {} programmes on txnId={}",
                    req.getSelectedProgrammeIds().size(), txn.getTxnId());
        }

        log.info("Payment SUCCESS: txnId={}, userId={}, amount={}",
                txn.getTxnId(), req.getUserId(), req.getAmount());
        return toTxnResponse(txn);
    }

    // ── Record failure and throw ──────────────────────────────────────────────

    private TransactionResponse recordAndThrow(PaymentRequest req,
                                               BankAccount acc,
                                               String method,
                                               String reason) {
        Transaction txn = Transaction.builder()
                .txnId(generateTxnId())
                .userId(req.getUserId())
                .eventId(req.getEventId())
                .amount(req.getAmount())
                .type("DEBIT")
                .method(method)
                .status("FAILED")
                .build();
        transactionRepository.save(txn);
        log.warn("Payment FAILED: userId={}, reason={}", req.getUserId(), reason);

        TransactionResponse resp = toTxnResponse(txn);
        resp.setFailureReason(reason);
        throw new PaymentFailedException(reason);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String generateTxnId() {
        return "TXN-" + System.currentTimeMillis() + "-"
                + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private BankAccountResponse toAccountResponse(BankAccount acc) {
        String masked = "****" + acc.getCardNumber()
                .substring(acc.getCardNumber().length() - 4);
        return BankAccountResponse.builder()
                .userId(acc.getUserId())
                .cardHolder(acc.getCardHolder())
                .expiry(acc.getExpiry())
                .balance(acc.getBalance())
                .upiId(acc.getUpiId())
                .netBankingId(acc.getNetBankingId())
                .bankName(acc.getBankName())
                .maskedCardNumber(masked)
                .build();
    }

    private TransactionResponse toTxnResponse(Transaction txn) {
        return TransactionResponse.builder()
                .txnId(txn.getTxnId())
                .userId(txn.getUserId())
                .eventId(txn.getEventId())
                .amount(txn.getAmount())
                .type(txn.getType())
                .method(txn.getMethod())
                .status(txn.getStatus())
                .createdAt(txn.getCreatedAt())
                .build();
    }
}