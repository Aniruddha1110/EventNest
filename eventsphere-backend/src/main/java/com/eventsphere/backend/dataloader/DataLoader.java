package com.eventsphere.backend.dataloader;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.Programme;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.entity.bank.BankAccount;
import com.eventsphere.backend.entity.h2.EventFeedback;
import com.eventsphere.backend.entity.h2.EventMetadata;
import com.eventsphere.backend.entity.h2.ProgrammeMeta;
import com.eventsphere.backend.event.UserRegisteredEvent;
import com.eventsphere.backend.repository.EventRepository;
import com.eventsphere.backend.repository.ProgrammeRepository;
import com.eventsphere.backend.repository.UserRepository;
import com.eventsphere.backend.repository.bank.BankAccountRepository;
import com.eventsphere.backend.repository.h2.EventFeedbackRepository;
import com.eventsphere.backend.repository.h2.EventMetadataRepository;
import com.eventsphere.backend.repository.h2.ProgrammeMetaRepository;
import com.eventsphere.backend.util.BankDetailGenerator;
import com.eventsphere.backend.entity.bank.Transaction;
import com.eventsphere.backend.repository.bank.TransactionRepository;
import java.math.BigDecimal;
import com.eventsphere.backend.dataloader.MetadataSeeder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import com.eventsphere.backend.entity.OAuthUser;
import com.eventsphere.backend.event.OAuthUserRegisteredEvent;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * DataLoader — seeds all H2 tables on startup, reacts to new user registrations.
 *
 * ═══════════════════════════════════════════════════════════
 * ON STARTUP (ApplicationReadyEvent) — runs in this order:
 * ═══════════════════════════════════════════════════════════
 *
 * PHASE 1 — Bank accounts
 *   Reads all Oracle USERS → generates one BankAccount per user via BankDetailGenerator
 *
 * PHASE 2 — Event metadata (type + category)
 *   Reads all Oracle EVENTS → classifies each via MetadataSeeder.classifyEvent()
 *   Stores one EventMetadata row per event (eventType, category)
 *
 * PHASE 3 — Programme metadata (price + seats)
 *   Reads all Oracle PROGRAMMES → looks up parent event's type from Phase 2 result
 *   Assigns price (₹0 for Free, ₹99/₹199/₹299/₹499 cycling for Paid)
 *   Stores one ProgrammeMeta row per programme (price, seatsBooked=0)
 *
 * PHASE 4 — Mock feedback for completed events
 *   Reads all Oracle EVENTS with status = "completed"
 *   Reads all Oracle USERS (for realistic display names)
 *   Generates 2–4 mock feedback entries per completed event via MetadataSeeder
 *   Stores in H2 EVENT_FEEDBACK table
 *
 * ═══════════════════════════════════════════════════════════
 * ON NEW USER REGISTRATION (UserRegisteredEvent):
 * ═══════════════════════════════════════════════════════════
 *   Creates one BankAccount in H2 for the new user immediately.
 *
 * ═══════════════════════════════════════════════════════════
 * WHY H2 IS WIPED EVERY RESTART:
 * ═══════════════════════════════════════════════════════════
 *   H2 is in-memory. All data is lost on shutdown.
 *   This DataLoader recreates everything from Oracle on every start.
 *   Seat counts reset to 0, feedback seeded fresh. This is intentional.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements ApplicationListener<ApplicationReadyEvent> {

    // Oracle repos
    private final UserRepository        userRepository;
    private final EventRepository       eventRepository;
    private final ProgrammeRepository   programmeRepository;

    // H2 repos — bank
    private final BankAccountRepository bankAccountRepository;
    private final TransactionRepository    transactionRepository;

    // H2 repos — metadata
    private final EventMetadataRepository  eventMetadataRepository;
    private final ProgrammeMetaRepository  programmeMetaRepository;
    private final EventFeedbackRepository  eventFeedbackRepository;

    // ── STARTUP ───────────────────────────────────────────────────────────────

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        log.info("╔══════════════════════════════════════════╗");
        log.info("║  DataLoader: seeding H2 tables...        ║");
        log.info("╚══════════════════════════════════════════╝");

        List<User>      users      = userRepository.findAll();
        List<Event>     events     = eventRepository.findAll();
        List<Programme> programmes = programmeRepository.findAll();

        seedBankAccounts(users);
        Map<String, String> eventTypeMap = seedEventMetadata(events);
        seedProgrammeMeta(programmes, eventTypeMap);
        seedMockFeedback(events, users);
        seedMockTransactions(events, users);

        log.info("DataLoader: all H2 tables seeded successfully.");
    }

    // ── PHASE 1: Bank accounts ────────────────────────────────────────────────

    private void seedBankAccounts(List<User> users) {
        int created = 0;
        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
            if (!bankAccountRepository.existsByUserId(user.getUserId())) {
                BankAccount account = BankDetailGenerator.generate(user, i);
                bankAccountRepository.save(account);
                created++;
            }
        }
        log.info("DataLoader [Phase 1]: {} bank accounts created for {} users.", created, users.size());
    }

    // ── PHASE 2: Event metadata ───────────────────────────────────────────────

    /**
     * Returns a map of eventId → eventType so Phase 3 can look up parent type
     * without another DB query.
     */
    private Map<String, String> seedEventMetadata(List<Event> events) {
        int created = 0;
        java.util.Map<String, String> typeMap = new java.util.HashMap<>();

        for (Event e : events) {
            EventMetadata meta = MetadataSeeder.classifyEvent(e);
            typeMap.put(e.getEventId(), meta.getEventType());

            if (!eventMetadataRepository.existsByEventId(e.getEventId())) {
                eventMetadataRepository.save(meta);
                created++;
            }
        }
        log.info("DataLoader [Phase 2]: {} event metadata rows created for {} events.", created, events.size());
        return typeMap;
    }

    // ── PHASE 3: Programme metadata ───────────────────────────────────────────

    private void seedProgrammeMeta(List<Programme> programmes,
                                   Map<String, String> eventTypeMap) {
        int created = 0;
        // Track price index per event so programmes within the same paid event
        // cycle through prices rather than all getting the same one
        java.util.Map<String, Integer> priceIndexByEvent = new java.util.HashMap<>();

        for (Programme p : programmes) {
            if (programmeMetaRepository.existsByProgrammeId(p.getProgrammeId())) continue;

            String eventId   = p.getEvent() != null ? p.getEvent().getEventId() : null;
            String eventType = eventId != null
                    ? eventTypeMap.getOrDefault(eventId, "Free")
                    : "Free";

            int priceIdx = priceIndexByEvent.getOrDefault(eventId, 0);
            priceIndexByEvent.put(eventId, priceIdx + 1);

            ProgrammeMeta meta = MetadataSeeder.buildProgrammeMeta(p, eventType, priceIdx);
            programmeMetaRepository.save(meta);
            created++;
        }
        log.info("DataLoader [Phase 3]: {} programme meta rows created for {} programmes.",
                created, programmes.size());
    }

    // ── PHASE 4: Mock feedback ────────────────────────────────────────────────

    private void seedMockFeedback(List<Event> events, List<User> users) {
        if (users.isEmpty()) {
            log.warn("DataLoader [Phase 4]: no users found in Oracle, skipping feedback seed.");
            return;
        }

        int created = 0;
        List<Event> completed = events.stream()
                .filter(e -> "completed".equals(e.getEventStatus()))
                .toList();

        for (Event event : completed) {
            List<EventFeedback> feedbacks =
                    MetadataSeeder.buildMockFeedback(event.getEventId(), users);

            for (EventFeedback fb : feedbacks) {
                // Guard: don't insert duplicate (userId + eventId pair)
                if (!eventFeedbackRepository.existsByEventIdAndUserId(
                        fb.getEventId(), fb.getUserId())) {
                    eventFeedbackRepository.save(fb);
                    created++;
                }
            }
        }
        log.info("DataLoader [Phase 4]: {} mock feedback entries created for {} completed events.",
                created, completed.size());
    }

    // ── PHASE 5: Mock transactions ────────────────────────────────────────────

    private void seedMockTransactions(List<Event> events, List<User> users) {
        if (transactionRepository.count() > 0) return; // already seeded
        if (users.isEmpty() || events.isEmpty()) return;

        // Use first user (U-0001) and first 3 events for demo tickets
        String userId = users.get(0).getUserId();
        int created = 0;

        int[] prices = {1499, 0, 299};
        String[] methods = {"CARD", "UPI", "NETBANKING"};

        for (int i = 0; i < Math.min(3, events.size()); i++) {
            String txnId  = "TXN-DEMO-000" + (i + 1);
            String eventId = events.get(i).getEventId();

            Transaction txn = Transaction.builder()
                    .txnId(txnId)
                    .userId(userId)
                    .eventId(eventId)
                    .amount(new BigDecimal(prices[i]))
                    .type("DEBIT")
                    .method(methods[i])
                    .status("SUCCESS")
                    .build();

            transactionRepository.save(txn);
            created++;
        }
        log.info("DataLoader [Phase 5]: {} mock transactions seeded for userId={}.", created, userId);
    }

    // ── LIVE EVENT: New user registration ─────────────────────────────────────

    /**
     * Fires when AuthService or OAuth2SuccessHandler registers a new user.
     * Creates their H2 bank account immediately without needing a restart.
     */
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        User user = event.getUser();
        if (bankAccountRepository.existsByUserId(user.getUserId())) return;

        long count = bankAccountRepository.count();
        BankAccount account = BankDetailGenerator.generate(user, (int) count);
        bankAccountRepository.save(account);
        log.info("DataLoader: created H2 bank account for new userId={}", user.getUserId());
    }

    @EventListener
    public void onOAuthUserRegistered(OAuthUserRegisteredEvent event) {
        OAuthUser oauthUser = event.getOauthUser();
        if (bankAccountRepository.existsByUserId(oauthUser.getOauthUserId())) return;

        long count = bankAccountRepository.count();
        BankAccount account = BankDetailGenerator.generateForOAuthUser(oauthUser, (int) count);
        bankAccountRepository.save(account);
        log.info("DataLoader: created H2 bank account for new oauthUserId={}", oauthUser.getOauthUserId());
    }
}