package com.eventsphere.backend.util;

import com.eventsphere.backend.entity.OAuthUser;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.entity.bank.BankAccount;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;

/**
 * Generates deterministic fake bank account details for each user.
 *
 * Called by DataLoader on startup and when UserRegisteredEvent /
 * OAuthUserRegisteredEvent fires.
 *
 * Two overloads:
 *   generate(User, int)       → for regular U-XXXX users
 *   generateForOAuthUser(OAuthUser, int) → for OAU-XXXX OAuth2 users
 *
 * Generation rules:
 *   cardNumber   → "4" + userId digits padded to 16 chars
 *   cvv          → 3-digit number from hash of username
 *   expiry       → "12/30" (fixed for all test accounts)
 *   balance      → random ₹5,000 – ₹50,000
 *   upiId        → username + "@ok" + bankName.toLowerCase()
 *   netBankingId → username
 *   netBankingPw → "Bank@" + last 4 of phone (or "0000" if no phone)
 *   bankName     → cycles Axis/HDFC/SBI/ICICI/Kotak by user index
 */
public final class BankDetailGenerator {

    private static final String[] BANKS = {
            "Axis Bank", "HDFC Bank", "SBI", "ICICI Bank", "Kotak Bank"
    };

    private static final SecureRandom RANDOM = new SecureRandom();

    private BankDetailGenerator() {}

    // ── Regular User (U-XXXX) ─────────────────────────────────────────────────

    /**
     * Generates a BankAccount entity for a regular Oracle USERS user.
     *
     * @param user      the Oracle User entity
     * @param userIndex 0-based index used for cycling bank names
     */
    public static BankAccount generate(User user, int userIndex) {
        String bankName     = BANKS[userIndex % BANKS.length];
        String cardNumber   = buildCardNumber(user.getUserId());
        String cvv          = buildCvv(user.getUserUsername());
        String upiId        = user.getUserUsername() + "@ok" + bankName.toLowerCase().replace(" ", "");
        String netBankingPw = "Bank@" + last4Phone(user.getUserPhoneNo());
        String cardHolder   = (user.getUserFirstName() + " " + user.getUserLastName()).toUpperCase();
        BigDecimal balance  = randomBalance();

        return BankAccount.builder()
                .userId(user.getUserId())
                .cardNumber(cardNumber)
                .cardHolder(cardHolder)
                .expiry("12/30")
                .cvv(cvv)
                .balance(balance)
                .upiId(upiId)
                .netBankingId(user.getUserUsername())
                .netBankingPw(netBankingPw)
                .bankName(bankName)
                .build();
    }

    // ── OAuth2 User (OAU-XXXX) ────────────────────────────────────────────────

    /**
     * Generates a BankAccount entity for an OAUTH_USERS user.
     * Uses oauthUserId (e.g. "OAU-0001") as the bank account's userId
     * so BankService can look it up from the JWT.
     *
     * Phone is null for OAuth users → netBankingPw defaults to "Bank@0000".
     *
     * @param oauthUser the OAUTH_USERS entity
     * @param userIndex 0-based index for cycling bank names
     */
    public static BankAccount generateForOAuthUser(OAuthUser oauthUser, int userIndex) {
        String bankName     = BANKS[userIndex % BANKS.length];
        String cardNumber   = buildCardNumber(oauthUser.getOauthUserId());
        String cvv          = buildCvv(oauthUser.getOauthUsername());
        String upiId        = oauthUser.getOauthUsername() + "@ok" + bankName.toLowerCase().replace(" ", "");
        String netBankingPw = "Bank@" + last4Phone(oauthUser.getOauthPhoneNo()); // always "Bank@0000"
        String cardHolder   = (oauthUser.getOauthFirstName() + " " + oauthUser.getOauthLastName()).toUpperCase();
        BigDecimal balance  = randomBalance();

        return BankAccount.builder()
                .userId(oauthUser.getOauthUserId())   // OAU-0001 — matches JWT sub claim
                .cardNumber(cardNumber)
                .cardHolder(cardHolder)
                .expiry("12/30")
                .cvv(cvv)
                .balance(balance)
                .upiId(upiId)
                .netBankingId(oauthUser.getOauthUsername())
                .netBankingPw(netBankingPw)
                .bankName(bankName)
                .build();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Builds a 16-digit card number starting with "4" (Visa-style).
     * Extracts digits from userId (e.g. "OAU-0001" → "0001") padded to 15 digits.
     */
    private static String buildCardNumber(String userId) {
        String digits = userId.replaceAll("[^0-9]", "");
        String padded = String.format("%015d", Long.parseLong(digits.isEmpty() ? "1" : digits));
        return "4" + padded;
    }

    /** Builds a 3-digit CVV from the username string hashCode. */
    private static String buildCvv(String username) {
        int hash = Math.abs(username.hashCode() % 1000);
        return String.format("%03d", hash);
    }

    /** Returns last 4 digits of phone or "0000" if phone is null/short. */
    private static String last4Phone(String phone) {
        if (phone == null || phone.length() < 4) return "0000";
        return phone.substring(phone.length() - 4);
    }

    /** Random balance between ₹5,000 and ₹50,000. */
    private static BigDecimal randomBalance() {
        return BigDecimal.valueOf(5000 + RANDOM.nextInt(45001))
                .setScale(2, RoundingMode.HALF_UP);
    }
}