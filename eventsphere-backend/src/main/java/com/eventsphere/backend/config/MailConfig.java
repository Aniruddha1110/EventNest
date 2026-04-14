package com.eventsphere.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * MailConfig — JavaMailSender is auto-configured by Spring Boot
 * via spring.mail.* properties in application.properties.
 *
 * @EnableAsync activates Spring's async execution support so that
 * MailService methods annotated with @Async run in a background thread.
 * Without this annotation, @Async is silently ignored and emails block
 * the HTTP request thread.
 *
 * No manual bean definition is needed for JavaMailSender — Spring Boot reads:
 *   spring.mail.host     = smtp.gmail.com
 *   spring.mail.port     = 587
 *   spring.mail.username = eventsphere.noreply@gmail.com
 *   spring.mail.password = <app password>
 *   spring.mail.properties.mail.smtp.auth              = true
 *   spring.mail.properties.mail.smtp.starttls.enable   = true
 */
@Configuration
@EnableAsync
public class MailConfig {
    // JavaMailSender auto-configured by Spring Boot via spring.mail.* properties
    // @EnableAsync activates @Async on MailService so emails do not block HTTP threads
}