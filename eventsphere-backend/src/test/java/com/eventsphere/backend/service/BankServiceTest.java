package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.PaymentRequest;
import com.eventsphere.backend.dto.response.BankAccountResponse;
import com.eventsphere.backend.dto.response.TransactionResponse;
import com.eventsphere.backend.entity.bank.BankAccount;
import com.eventsphere.backend.entity.bank.Transaction;
import com.eventsphere.backend.exception.PaymentFailedException;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.bank.BankAccountRepository;
import com.eventsphere.backend.repository.bank.TransactionRepository;
import com.eventsphere.backend.repository.h2.ProgrammeMetaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link BankService}.
 */
@ExtendWith(MockitoExtension.class)
class BankServiceTest {

    @Mock private BankAccountRepository   bankAccountRepository;
    @Mock private TransactionRepository   transactionRepository;
    @Mock private ProgrammeMetaRepository programmeMetaRepository;

    @InjectMocks
    private BankService bankService;

    private BankAccount buildAccount() {
        return BankAccount.builder()
                .id(1L)
                .userId("U-0001")
                .cardNumber("4000000000000001")
                .cardHolder("JOHN DOE")
                .expiry("12/30")
                .cvv("123")
                .balance(BigDecimal.valueOf(25000))
                .upiId("johndoe@okaxis")
                .netBankingId("johndoe")
                .netBankingPw("Bank@3210")
                .bankName("Axis Bank")
                .build();
    }

    private PaymentRequest buildCardPayment() {
        PaymentRequest req = new PaymentRequest();
        req.setUserId("U-0001");
        req.setAmount(BigDecimal.valueOf(500));
        req.setEventId("E-001");
        req.setMethod("CARD");
        req.setCardNumber("4000000000000001");
        req.setCvv("123");
        req.setExpiry("12/30");
        return req;
    }

    // ── Account Retrieval Tests ───────────────────────────────────────────────

    @Test
    @DisplayName("getAccount() — found → returns masked card number")
    void getAccount_found_returnsMaskedCard() {
        when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(buildAccount()));

        BankAccountResponse response = bankService.getAccount("U-0001");

        assertEquals("U-0001", response.getUserId());
        assertEquals("****0001", response.getMaskedCardNumber());
        assertEquals("JOHN DOE", response.getCardHolder());
        assertEquals("Axis Bank", response.getBankName());
    }

    @Test
    @DisplayName("getAccount() — not found → throws ResourceNotFoundException")
    void getAccount_notFound_throws() {
        when(bankAccountRepository.findByUserId("U-9999")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> bankService.getAccount("U-9999"));
    }

    // ── Card Payment Tests ────────────────────────────────────────────────────

    @Nested
    @DisplayName("Card Payments")
    class CardPaymentTests {

        @Test
        @DisplayName("Successful CARD payment deducts balance")
        void processCard_success_deductsBalance() {
            BankAccount acc = buildAccount();
            PaymentRequest req = buildCardPayment();

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(inv -> inv.getArgument(0));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            TransactionResponse response = bankService.processPayment(req);

            assertEquals("SUCCESS", response.getStatus());
            assertEquals("DEBIT", response.getType());
            assertEquals("CARD", response.getMethod());
            // Balance should be 25000 - 500 = 24500
            assertEquals(BigDecimal.valueOf(24500), acc.getBalance());
        }

        @Test
        @DisplayName("Wrong card number → throws PaymentFailedException")
        void processCard_wrongCardNumber_throwsPaymentFailed() {
            BankAccount acc = buildAccount();
            PaymentRequest req = buildCardPayment();
            req.setCardNumber("9999999999999999");

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThrows(PaymentFailedException.class,
                    () -> bankService.processPayment(req));
        }

        @Test
        @DisplayName("Wrong CVV → throws PaymentFailedException")
        void processCard_wrongCvv_throws() {
            BankAccount acc = buildAccount();
            PaymentRequest req = buildCardPayment();
            req.setCvv("999");

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThrows(PaymentFailedException.class,
                    () -> bankService.processPayment(req));
        }

        @Test
        @DisplayName("Insufficient balance → throws PaymentFailedException")
        void processCard_insufficientBalance_throws() {
            BankAccount acc = buildAccount();
            acc.setBalance(BigDecimal.valueOf(100)); // Only ₹100
            PaymentRequest req = buildCardPayment();
            req.setAmount(BigDecimal.valueOf(500)); // Need ₹500

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThrows(PaymentFailedException.class,
                    () -> bankService.processPayment(req));
        }

        @Test
        @DisplayName("Wrong expiry → throws PaymentFailedException")
        void processCard_wrongExpiry_throws() {
            BankAccount acc = buildAccount();
            PaymentRequest req = buildCardPayment();
            req.setExpiry("01/25");

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThrows(PaymentFailedException.class,
                    () -> bankService.processPayment(req));
        }
    }

    // ── Net Banking Payment Tests ─────────────────────────────────────────────

    @Nested
    @DisplayName("Net Banking Payments")
    class NetBankingPaymentTests {

        @Test
        @DisplayName("Successful NETBANKING payment")
        void processNetBanking_success() {
            BankAccount acc = buildAccount();
            PaymentRequest req = new PaymentRequest();
            req.setUserId("U-0001");
            req.setAmount(BigDecimal.valueOf(300));
            req.setEventId("E-001");
            req.setMethod("NETBANKING");
            req.setNetBankingId("johndoe");
            req.setNetBankingPw("Bank@3210");

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(inv -> inv.getArgument(0));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            TransactionResponse response = bankService.processPayment(req);

            assertEquals("SUCCESS", response.getStatus());
            assertEquals("NETBANKING", response.getMethod());
        }

        @Test
        @DisplayName("Wrong net banking ID → throws PaymentFailedException")
        void processNetBanking_wrongId_throws() {
            BankAccount acc = buildAccount();
            PaymentRequest req = new PaymentRequest();
            req.setUserId("U-0001");
            req.setAmount(BigDecimal.valueOf(300));
            req.setMethod("NETBANKING");
            req.setNetBankingId("wronguser");
            req.setNetBankingPw("Bank@3210");

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThrows(PaymentFailedException.class,
                    () -> bankService.processPayment(req));
        }
    }

    // ── UPI Payment Tests ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("UPI Payments")
    class UpiPaymentTests {

        @Test
        @DisplayName("Invalid UPI format → throws PaymentFailedException")
        void processUpi_invalidFormat_throws() {
            BankAccount acc = buildAccount();
            PaymentRequest req = new PaymentRequest();
            req.setUserId("U-0001");
            req.setAmount(BigDecimal.valueOf(100));
            req.setMethod("UPI");
            req.setUpiId("nope-no-at-sign");

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThrows(PaymentFailedException.class,
                    () -> bankService.processPayment(req));
        }

        @Test
        @DisplayName("UPI insufficient balance → throws PaymentFailedException")
        void processUpi_insufficientBalance_throws() {
            BankAccount acc = buildAccount();
            acc.setBalance(BigDecimal.valueOf(10));
            PaymentRequest req = new PaymentRequest();
            req.setUserId("U-0001");
            req.setAmount(BigDecimal.valueOf(500));
            req.setMethod("UPI");
            req.setUpiId("test@upi");

            when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
            when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

            assertThrows(PaymentFailedException.class,
                    () -> bankService.processPayment(req));
        }
    }

    // ── Transaction History ───────────────────────────────────────────────────

    @Test
    @DisplayName("getTransactions() returns list of TransactionResponse")
    void getTransactions_returnsList() {
        Transaction txn = Transaction.builder()
                .txnId("TXN-001")
                .userId("U-0001")
                .eventId("E-001")
                .amount(BigDecimal.valueOf(500))
                .type("DEBIT")
                .method("CARD")
                .status("SUCCESS")
                .createdAt(LocalDateTime.now())
                .build();

        when(transactionRepository.findByUserIdOrderByCreatedAtDesc("U-0001"))
                .thenReturn(List.of(txn));

        List<TransactionResponse> list = bankService.getTransactions("U-0001");

        assertEquals(1, list.size());
        assertEquals("TXN-001", list.get(0).getTxnId());
        assertEquals("SUCCESS", list.get(0).getStatus());
    }

    // ── Unknown payment method ────────────────────────────────────────────────

    @Test
    @DisplayName("Unknown payment method → throws PaymentFailedException")
    void processPayment_unknownMethod_throws() {
        BankAccount acc = buildAccount();
        PaymentRequest req = new PaymentRequest();
        req.setUserId("U-0001");
        req.setAmount(BigDecimal.valueOf(100));
        req.setMethod("BITCOIN");

        when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));

        assertThrows(PaymentFailedException.class,
                () -> bankService.processPayment(req));
    }

    // ── Account not found ─────────────────────────────────────────────────────

    @Test
    @DisplayName("processPayment() — account not found → throws ResourceNotFoundException")
    void processPayment_accountNotFound_throws() {
        PaymentRequest req = buildCardPayment();

        when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> bankService.processPayment(req));
    }

    // ── Seat increment on success ─────────────────────────────────────────────

    @Test
    @DisplayName("Successful payment increments seats for selected programmes")
    void processPayment_success_incrementsSeats() {
        BankAccount acc = buildAccount();
        PaymentRequest req = buildCardPayment();
        req.setSelectedProgrammeIds(List.of("P-0001", "P-0002"));

        when(bankAccountRepository.findByUserId("U-0001")).thenReturn(Optional.of(acc));
        when(bankAccountRepository.save(any(BankAccount.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));

        bankService.processPayment(req);

        verify(programmeMetaRepository).incrementSeatsBooked("P-0001");
        verify(programmeMetaRepository).incrementSeatsBooked("P-0002");
    }
}
