package com.eventsphere.backend.event;

import com.eventsphere.backend.entity.User;
import org.springframework.context.ApplicationEvent;

/**
 * Published by AuthService after a new User is saved to Oracle.
 * DataLoader listens for this event and automatically creates
 * an H2 bank account for the new user.
 *
 * Also published by OAuth2SuccessHandler when a new OAuth2 user is created.
 *
 * Flow:
 *   AuthService.registerUser() → save User → publishEvent(UserRegisteredEvent)
 *   DataLoader.onUserRegistered() → BankDetailGenerator.generate() → save BankAccount
 */
public class UserRegisteredEvent extends ApplicationEvent {

    private final User user;

    public UserRegisteredEvent(Object source, User user) {
        super(source);
        this.user = user;
    }

    public User getUser() {
        return user;
    }
}