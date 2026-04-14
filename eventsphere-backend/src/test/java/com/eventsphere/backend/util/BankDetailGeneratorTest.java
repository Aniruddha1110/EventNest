package com.eventsphere.backend.util;

import com.eventsphere.backend.entity.OAuthUser;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.entity.bank.BankAccount;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link BankDetailGenerator}.
 */
class BankDetailGeneratorTest {

    private User buildTestUser() {
        return User.builder()
                .userId("U-0001")
                .userFirstName("Aniruddha")
                .userLastName("Das")
                .userEmail("aniruddha@test.com")
                .userPhoneNo("9876543210")
                .userUsername("aniruddha_d")
                .userPassword("dummyhash")
                .build();
    }

    private OAuthUser buildTestOAuthUser() {
        return OAuthUser.builder()
                .oauthUserId("OAU-0001")
                .oauthFirstName("Google")
                .oauthLastName("User")
                .oauthEmail("google@test.com")
                .oauthUsername("google_user")
                .oauthDummyPw("dummyhash")
                .oauthProvider("google")
                .build();
    }

    @Test
    @DisplayName("generate() returns a BankAccount with all fields populated")
    void generate_returnsValidBankAccount() {
        BankAccount account = BankDetailGenerator.generate(buildTestUser(), 0);

        assertNotNull(account);
        assertNotNull(account.getUserId());
        assertNotNull(account.getCardNumber());
        assertNotNull(account.getCardHolder());
        assertNotNull(account.getExpiry());
        assertNotNull(account.getCvv());
        assertNotNull(account.getBalance());
        assertNotNull(account.getUpiId());
        assertNotNull(account.getNetBankingId());
        assertNotNull(account.getNetBankingPw());
        assertNotNull(account.getBankName());
    }

    @Test
    @DisplayName("Card number starts with '4' (Visa format)")
    void generate_cardNumberStartsWith4() {
        BankAccount account = BankDetailGenerator.generate(buildTestUser(), 0);
        assertTrue(account.getCardNumber().startsWith("4"));
    }

    @Test
    @DisplayName("Card number is exactly 16 digits")
    void generate_cardNumberIs16Digits() {
        BankAccount account = BankDetailGenerator.generate(buildTestUser(), 0);
        assertEquals(16, account.getCardNumber().length());
        assertTrue(account.getCardNumber().matches("^\\d{16}$"));
    }

    @Test
    @DisplayName("CVV is exactly 3 digits")
    void generate_cvvIs3Digits() {
        BankAccount account = BankDetailGenerator.generate(buildTestUser(), 0);
        assertEquals(3, account.getCvv().length());
        assertTrue(account.getCvv().matches("^\\d{3}$"));
    }

    @Test
    @DisplayName("Bank name cycles through BANKS array by index")
    void generate_cyclesBankNames() {
        User user = buildTestUser();
        assertEquals("Axis Bank", BankDetailGenerator.generate(user, 0).getBankName());
        assertEquals("HDFC Bank", BankDetailGenerator.generate(user, 1).getBankName());
        assertEquals("SBI",       BankDetailGenerator.generate(user, 2).getBankName());
        assertEquals("ICICI Bank",BankDetailGenerator.generate(user, 3).getBankName());
        assertEquals("Kotak Bank",BankDetailGenerator.generate(user, 4).getBankName());
        // Wrap around
        assertEquals("Axis Bank", BankDetailGenerator.generate(user, 5).getBankName());
    }

    @Test
    @DisplayName("generateForOAuthUser() uses OAuth user ID as userId")
    void generateForOAuthUser_usesOAuthUserId() {
        OAuthUser oauthUser = buildTestOAuthUser();
        BankAccount account = BankDetailGenerator.generateForOAuthUser(oauthUser, 0);
        assertEquals("OAU-0001", account.getUserId());
    }

    @Test
    @DisplayName("Net banking password defaults to 'Bank@0000' when phone is null")
    void generate_netBankingPwDefaultsWhenNoPhone() {
        OAuthUser oauthUser = buildTestOAuthUser();
        oauthUser.setOauthPhoneNo(null);
        BankAccount account = BankDetailGenerator.generateForOAuthUser(oauthUser, 0);
        assertEquals("Bank@0000", account.getNetBankingPw());
    }

    @Test
    @DisplayName("Card holder name is uppercase")
    void generate_cardHolderIsUppercase() {
        BankAccount account = BankDetailGenerator.generate(buildTestUser(), 0);
        assertEquals("ANIRUDDHA DAS", account.getCardHolder());
    }

    @Test
    @DisplayName("Expiry is always '12/30'")
    void generate_expiryIsFixed() {
        BankAccount account = BankDetailGenerator.generate(buildTestUser(), 0);
        assertEquals("12/30", account.getExpiry());
    }

    @Test
    @DisplayName("Balance is between 5000 and 50000")
    void generate_balanceInRange() {
        for (int i = 0; i < 20; i++) {
            BankAccount account = BankDetailGenerator.generate(buildTestUser(), i);
            assertTrue(account.getBalance().intValue() >= 5000);
            assertTrue(account.getBalance().intValue() <= 50000);
        }
    }
}
