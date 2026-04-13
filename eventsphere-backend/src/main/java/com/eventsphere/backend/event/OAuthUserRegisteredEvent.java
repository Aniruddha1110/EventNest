package com.eventsphere.backend.event;

import com.eventsphere.backend.entity.OAuthUser;
import org.springframework.context.ApplicationEvent;

/**
 * Published by OAuth2SuccessHandler after a new OAuthUser is saved to Oracle.
 * DataLoader listens for this event and automatically creates
 * an H2 bank account for the new OAuth2 user.
 *
 * Flow:
 *   OAuth2SuccessHandler.createOAuthUser() → save OAuthUser
 *     → publishEvent(OAuthUserRegisteredEvent)
 *   DataLoader.onOAuthUserRegistered() → BankDetailGenerator.generateForOAuthUser()
 *     → save BankAccount (userId = OAU-0001 etc.)
 */
public class OAuthUserRegisteredEvent extends ApplicationEvent {

    private final OAuthUser oauthUser;

    public OAuthUserRegisteredEvent(Object source, OAuthUser oauthUser) {
        super(source);
        this.oauthUser = oauthUser;
    }

    public OAuthUser getOauthUser() {
        return oauthUser;
    }
}