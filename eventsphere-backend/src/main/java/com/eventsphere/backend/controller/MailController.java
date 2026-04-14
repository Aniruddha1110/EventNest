package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.request.MailRequest;
import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.MailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Mail controller — admin broadcast emails.
 *
 * Endpoints:
 *   POST /api/mail/send → send broadcast email (ROLE_ADMIN only)
 *
 * The actual sending is async (@Async in MailService) so this endpoint
 * returns immediately with HTTP 200. The email is dispatched in a background thread.
 *
 * MailRequest fields:
 *   target     : "All" | "Users" | "Organisers"
 *   mode       : "all" (use target table) | "particular" (use recipients list)
 *   recipients : list of email strings (used when mode = "particular")
 *   subject    : email subject line
 *   body       : email body (HTML allowed)
 */
@RestController
@RequestMapping("/api/mail")
@RequiredArgsConstructor
public class MailController {

    private final MailService mailService;

    /**
     * POST /api/mail/send
     * Admin only — secured by SecurityConfig (ROLE_ADMIN).
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse> sendMail(@Valid @RequestBody MailRequest req) {
        mailService.sendBroadcast(req);
        return ResponseEntity.ok(
                ApiResponse.success("Mail dispatch initiated. Emails are being sent in the background."));
    }
}