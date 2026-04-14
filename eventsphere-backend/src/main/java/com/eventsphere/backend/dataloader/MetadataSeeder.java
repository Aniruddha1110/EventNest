package com.eventsphere.backend.dataloader;

import com.eventsphere.backend.entity.Event;
import com.eventsphere.backend.entity.Programme;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.entity.h2.EventFeedback;
import com.eventsphere.backend.entity.h2.EventMetadata;
import com.eventsphere.backend.entity.h2.ProgrammeMeta;

import java.util.List;
import java.util.Random;

/**
 * Utility class used exclusively by DataLoader to generate H2 seed data.
 *
 * Contains three static methods:
 *   classifyEvent()     → determines category + type from event name
 *   buildProgrammeMeta() → assigns price based on event type
 *   buildMockFeedback() → generates realistic fake feedback from real user names
 *
 * Classification rules for existing 10 Oracle events:
 *
 *   Tech Fest           → Technical, Free
 *   Rangoli Making      → Cultural,  Free
 *   Debate              → Technical, Free   (academic/intellectual)
 *   Saraswati Puja      → Ceremony,  Free
 *   Republic Day        → Ceremony,  Free
 *   Flower Show         → Cultural,  Free
 *   KIIT Fest School W  → Cultural,  Free
 *   KIIT Fest           → Cultural,  Paid   (flagship paid event)
 *   Manpasand           → Cultural,  Free
 *   Rang-e-Bahar        → Cultural,  Paid   (paid festival)
 *
 * Price assignment for paid event programmes: ₹99, ₹199, ₹299, ₹499
 * Cycles based on programme index so different programmes in same event have variety.
 */
public final class MetadataSeeder {

    private static final int[] PAID_PRICES = {99, 199, 299, 499};
    private static final Random RANDOM = new Random(42); // fixed seed = reproducible

    private MetadataSeeder() {}

    // ── Event classification ──────────────────────────────────────────────────

    /**
     * Classifies an event by inspecting its name for keywords.
     * Returns an EventMetadata entity ready to be saved into H2.
     */
    public static EventMetadata classifyEvent(Event event) {
        String name = event.getEventName().toLowerCase();
        String category = detectCategory(name);
        String type     = detectType(name);

        return EventMetadata.builder()
                .eventId(event.getEventId())
                .eventType(type)
                .category(category)
                .build();
    }

    private static String detectCategory(String name) {
        if (name.contains("tech") || name.contains("cod") || name.contains("hack")
                || name.contains("debate") || name.contains("robot")) return "Technical";
        if (name.contains("sport") || name.contains("volley") || name.contains("tennis")
                || name.contains("cricket") || name.contains("athlet")) return "Sports";
        if (name.contains("puja") || name.contains("republic") || name.contains("flag")
                || name.contains("parade") || name.contains("ceremony")) return "Ceremony";
        if (name.contains("food") || name.contains("carnival") || name.contains("snack")) return "Food";
        // Default: Cultural covers rangoli, fest, music, dance, holi, flower etc.
        return "Cultural";
    }

    private static String detectType(String name) {
        // These specific events in the seed data are paid
        if (name.contains("kiit fest") && !name.contains("school"))  return "Paid";
        if (name.contains("rang-e-bahar") || name.contains("rang e bahar")) return "Paid";
        return "Free";
    }

    // ── Programme meta ────────────────────────────────────────────────────────

    /**
     * Builds a ProgrammeMeta for a programme based on its parent event's type.
     * Free events → price = 0. Paid events → cycles through PAID_PRICES.
     */
    public static ProgrammeMeta buildProgrammeMeta(Programme programme,
                                                   String eventType,
                                                   int priceIndex) {
        int price = "Paid".equals(eventType)
                ? PAID_PRICES[priceIndex % PAID_PRICES.length]
                : 0;

        return ProgrammeMeta.builder()
                .programmeId(programme.getProgrammeId())
                .price(price)
                .seatsBooked(0)
                .build();
    }

    // ── Mock feedback ─────────────────────────────────────────────────────────

    private static final String[] COMMENTS = {
            "Absolutely fantastic event! Brilliantly organised.",
            "Great experience overall. Would love more workshops next time.",
            "Very well managed. The crowd was amazing.",
            "One of the best events I have attended on campus!",
            "Good event, a few things could be smoother but overall enjoyed it.",
            "Incredible atmosphere. Looking forward to the next one.",
            "The performances were outstanding. Loved every moment.",
            "Really well coordinated. Keep up the great work!",
            "Had a blast. The team did a phenomenal job.",
            "Nicely organised. The venue choice was perfect.",
            "Enjoyable event. The energy was electric throughout.",
            "Superb execution. Everything ran on time.",
    };

    /**
     * Generates mock feedback entries for a completed event using real user names.
     * Creates between 2 and 4 feedbacks per event so the UI always looks populated.
     * Ratings are weighted towards 4–5 stars (realistic for seed data).
     */
    public static List<EventFeedback> buildMockFeedback(String eventId, List<User> users) {
        int count = 2 + RANDOM.nextInt(3); // 2, 3, or 4 feedbacks per event
        count = Math.min(count, users.size()); // can't exceed available users

        // Deterministic shuffle based on eventId hashcode so different events
        // get different users without being purely random each restart
        int offset = Math.abs(eventId.hashCode()) % users.size();

        java.util.List<EventFeedback> result = new java.util.ArrayList<>();
        for (int i = 0; i < count; i++) {
            User user = users.get((offset + i) % users.size());

            String display = user.getUserFirstName() + " "
                    + user.getUserLastName().charAt(0) + ".";

            // Weighted ratings: 3→10%, 4→40%, 5→50%
            int rating = weightedRating();

            int commentIdx = Math.abs((eventId + user.getUserId()).hashCode()) % COMMENTS.length;
            String comment = COMMENTS[commentIdx];

            // Spread submission dates across a few days after the event
            java.time.LocalDateTime submitted = java.time.LocalDateTime.now()
                    .minusDays(RANDOM.nextInt(30) + 1);

            result.add(EventFeedback.builder()
                    .eventId(eventId)
                    .userId(user.getUserId())
                    .userDisplay(display)
                    .rating(rating)
                    .comment(comment)
                    .submittedAt(submitted)
                    .build());
        }
        return result;
    }

    private static int weightedRating() {
        int r = RANDOM.nextInt(10);
        if (r < 1) return 3;      // 10%
        if (r < 5) return 4;      // 40%
        return 5;                  // 50%
    }
}