package com.eventsphere.backend.entity.bank;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "BANK_ACCOUNTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", length = 10, nullable = false, unique = true)
    private String userId;

    @Column(name = "CARD_NUMBER", length = 16, nullable = false)
    private String cardNumber;

    @Column(name = "CARD_HOLDER", length = 100, nullable = false)
    private String cardHolder;

    @Column(name = "EXPIRY", length = 5, nullable = false)
    private String expiry;

    @Column(name = "CVV", length = 4, nullable = false)
    private String cvv;

    @Column(name = "BALANCE", nullable = false, precision = 10, scale = 2)
    private BigDecimal balance;

    @Column(name = "UPI_ID", length = 50, nullable = false)
    private String upiId;

    @Column(name = "NET_BANKING_ID", length = 50, nullable = false)
    private String netBankingId;

    @Column(name = "NET_BANKING_PW", length = 50, nullable = false)
    private String netBankingPw;

    @Column(name = "BANK_NAME", length = 30, nullable = false)
    private String bankName;
}