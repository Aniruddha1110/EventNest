package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.MailRequest;
import com.eventsphere.backend.repository.OrganiserRepository;
import com.eventsphere.backend.repository.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Mail service — sends HTML emails via Gmail SMTP.
 *
 * From address: eventsphere.noreply@gmail.com (set in application.properties)
 *
 * Used for:
 *   - OTP emails (forgot password)
 *   - Admin broadcast emails (all users / all organisers / specific recipients)
 *   - Organiser approval/rejection notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender     mailSender;
    private final UserRepository     userRepository;
    private final OrganiserRepository organiserRepository;

    private static final String FROM    = "eventsphere.noreply@gmail.com";
    private static final String BRAND   = "EventSphere";

    // ── OTP mail ──────────────────────────────────────────────────────────────

    @Async
    public void sendOtp(String toEmail, String otp) {
        String subject = BRAND + " — Your OTP for Password Reset";
        String body = buildOtpHtml(otp);
        sendHtml(toEmail, subject, body);
    }

    // ── Admin broadcast ───────────────────────────────────────────────────────

    /**
     * Sends a broadcast email based on MailRequest target/mode configuration.
     */
    @Async
    public void sendBroadcast(MailRequest req) {
        List<String> recipients = resolveRecipients(req);
        for (String email : recipients) {
            String html = buildBroadcastHtml(req.getSubject(), req.getBody());
            sendHtml(email, req.getSubject(), html);
        }
        log.info("Broadcast sent to {} recipients", recipients.size());
    }

    // ── Approval / rejection notifications ────────────────────────────────────

    @Async
    public void sendProgrammeApproved(String toEmail, String organiseName, String programmeName) {
        String subject = BRAND + " — Programme Approved: " + programmeName;
        String body    = buildNotificationHtml(
                "Programme Approved ✅",
                "Great news! Your programme <strong>" + programmeName + "</strong> has been approved and is now live on EventSphere.",
                organiseName
        );
        sendHtml(toEmail, subject, body);
    }

    @Async
    public void sendProgrammeRejected(String toEmail, String organiseName, String programmeName) {
        String subject = BRAND + " — Programme Rejected: " + programmeName;
        String body    = buildNotificationHtml(
                "Programme Rejected ❌",
                "Unfortunately your programme <strong>" + programmeName + "</strong> has been rejected. Please contact the admin for more details.",
                organiseName
        );
        sendHtml(toEmail, subject, body);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private List<String> resolveRecipients(MailRequest req) {
        if ("particular".equalsIgnoreCase(req.getMode())) {
            return req.getRecipients() != null ? req.getRecipients() : new ArrayList<>();
        }

        List<String> emails = new ArrayList<>();
        String target = req.getTarget();

        if ("All".equalsIgnoreCase(target) || "Users".equalsIgnoreCase(target)) {
            userRepository.findAll().forEach(u -> emails.add(u.getUserEmail()));
        }
        if ("All".equalsIgnoreCase(target) || "Organisers".equalsIgnoreCase(target)) {
            organiserRepository.findAll().forEach(o -> emails.add(o.getOrganiserEmail()));
        }
        return emails;
    }

    private void sendHtml(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(FROM);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML
            mailSender.send(message);
            log.debug("Email sent to={}, subject={}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to={}: {}", to, e.getMessage());
        }
    }

    // ── HTML templates ────────────────────────────────────────────────────────

    private String buildOtpHtml(String otp) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:40px auto;background:#fff;border:1px solid #e5e7eb;padding:40px;border-radius:8px">
              <h2 style="color:#111;font-size:22px;margin-bottom:8px">EventSphere</h2>
              <p style="color:#6b7280;font-size:14px;margin-bottom:32px">Password Reset Request</p>
              <p style="color:#111;font-size:15px;margin-bottom:16px">Your one-time password (OTP) is:</p>
              <div style="background:#f3f4f6;padding:20px;text-align:center;border-radius:6px;margin-bottom:24px">
                <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#111">%s</span>
              </div>
              <p style="color:#6b7280;font-size:13px">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px">If you did not request a password reset, ignore this email. Your account is safe.</p>
            </div>
            """.formatted(otp);
    }

    private String buildBroadcastHtml(String subject, String body) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:40px auto;background:#fff;border:1px solid #e5e7eb;padding:40px;border-radius:8px">
              <h2 style="color:#111;font-size:20px;margin-bottom:8px">EventSphere</h2>
              <h3 style="color:#374151;font-size:17px;margin-bottom:24px">%s</h3>
              <div style="color:#374151;font-size:15px;line-height:1.6">%s</div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px">This message was sent by EventSphere administration.</p>
            </div>
            """.formatted(subject, body);
    }

    private String buildNotificationHtml(String heading, String message, String name) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:40px auto;background:#fff;border:1px solid #e5e7eb;padding:40px;border-radius:8px">
              <h2 style="color:#111;font-size:20px;margin-bottom:8px">EventSphere</h2>
              <h3 style="color:#374151;font-size:17px;margin-bottom:16px">%s</h3>
              <p style="color:#374151;font-size:15px;line-height:1.6;margin-bottom:24px">Dear <strong>%s</strong>,<br><br>%s</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px">EventSphere Administration</p>
            </div>
            """.formatted(heading, name, message);
    }
}