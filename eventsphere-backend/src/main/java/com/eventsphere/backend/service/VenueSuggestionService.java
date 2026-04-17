package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.VenueSuggestRequest;
import com.eventsphere.backend.dto.response.VenueSuggestionResponse;
import com.eventsphere.backend.dto.response.VenueSuggestionResponse.SuggestedVenue;
import com.eventsphere.backend.entity.Venue;
import com.eventsphere.backend.repository.VenueRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * VenueSuggestionService
 * ======================
 * Bridges the Spring Boot backend and the Python ML Flask service.
 *
 * Flow:
 *  1. Receive VenueSuggestRequest from the controller.
 *  2. Load ALL venues from Oracle (only available ones will be scored).
 *  3. Parse eventStartDate → derive month (1-12) and dayOfWeek (0-6).
 *  4. Build JSON payload and POST it to http://localhost:5000/predict.
 *  5. Parse Flask response → map to VenueSuggestionResponse.
 *  6. If Flask is unreachable → fall back to capacity-ranked suggestions
 *     so the UI is never broken even if the ML service is down.
 *
 * Configuration:
 *   ml.service.url = http://localhost:5000   (in application.properties)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VenueSuggestionService {

    private final VenueRepository venueRepository;
    private final ObjectMapper    objectMapper = new ObjectMapper();
    private final HttpClient      httpClient   = HttpClient.newHttpClient();

    @Value("${ml.service.url:http://localhost:5000}")
    private String mlServiceUrl;

    // ── Public API ─────────────────────────────────────────────────────────────

    public VenueSuggestionResponse suggest(VenueSuggestRequest req) {

        // 1. Fetch all venues from Oracle
        List<Venue> allVenues = venueRepository.findAll();

        // 2. Parse date to get month + dayOfWeek
        LocalDate date       = LocalDate.parse(req.getEventStartDate(),
                DateTimeFormatter.ISO_LOCAL_DATE);
        int month      = date.getMonthValue();               // 1–12
        int dayOfWeek  = date.getDayOfWeek().getValue() - 1; // 0=Mon … 6=Sun

        // 3. Call ML service
        try {
            String requestBody = buildRequestJson(req, allVenues, month, dayOfWeek);
            log.debug("Calling ML service: POST {}/predict  body={}", mlServiceUrl, requestBody);

            HttpRequest httpReq = HttpRequest.newBuilder()
                    .uri(URI.create(mlServiceUrl + "/predict"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> httpResp =
                    httpClient.send(httpReq, HttpResponse.BodyHandlers.ofString());

            if (httpResp.statusCode() == 200) {
                return parseFlaskResponse(httpResp.body(), req.getCategory());
            } else {
                log.warn("ML service returned status {}; using capacity fallback.", httpResp.statusCode());
                return capacityFallback(allVenues, req.getCategory());
            }

        } catch (Exception ex) {
            log.warn("ML service unreachable ({}); using capacity fallback. Cause: {}",
                    mlServiceUrl, ex.getMessage());
            return capacityFallback(allVenues, req.getCategory());
        }
    }

    // ── Build JSON payload for Flask ───────────────────────────────────────────

    private String buildRequestJson(VenueSuggestRequest req,
                                    List<Venue> venues,
                                    int month,
                                    int dayOfWeek) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("category",       req.getCategory());
        root.put("event_type",     req.getEventType());
        root.put("event_month",    month);
        root.put("day_of_week",    dayOfWeek);
        root.put("duration_hours", req.getDurationHours());

        ArrayNode venueArray = root.putArray("venues");
        for (Venue v : venues) {
            ObjectNode vNode = venueArray.addObject();
            vNode.put("venue_id",            v.getVenueId());
            vNode.put("venue_name",          v.getVenueName());
            vNode.put("venue_capacity",      v.getVenueCapacity());
            vNode.put("venue_availability",  v.getVenueAvailability() != null
                    ? v.getVenueAvailability() : "Y");
        }
        return objectMapper.writeValueAsString(root);
    }

    // ── Parse Flask JSON response ──────────────────────────────────────────────

    private VenueSuggestionResponse parseFlaskResponse(String body, String category) throws Exception {
        JsonNode root        = objectMapper.readTree(body);
        JsonNode suggestions = root.path("suggestions");

        List<SuggestedVenue> list = new ArrayList<>();
        for (JsonNode s : suggestions) {
            list.add(SuggestedVenue.builder()
                    .venueId(s.path("venue_id").asText())
                    .venueName(s.path("venue_name").asText())
                    .venueCapacity(s.path("venue_capacity").asInt())
                    .suitabilityScore(s.path("suitability_score").asDouble())
                    .rank(s.path("rank").asInt())
                    .build());
        }

        log.info("ML suggestion for category={}: top venue={} score={}",
                category,
                list.isEmpty() ? "none" : list.get(0).getVenueName(),
                list.isEmpty() ? 0 : list.get(0).getSuitabilityScore());

        return VenueSuggestionResponse.builder()
                .suggestions(list)
                .category(category)
                .message(String.format("Top %d venue%s for %s events",
                        list.size(), list.size() == 1 ? "" : "s", category))
                .build();
    }

    // ── Capacity-based fallback (ML service down) ──────────────────────────────

    /**
     * If the Flask service is unreachable, we still return a useful response
     * by sorting available venues by capacity (descending) and assigning
     * a synthetic suitability score of 0.5 so the UI renders gracefully.
     */
    private VenueSuggestionResponse capacityFallback(List<Venue> venues, String category) {
        List<SuggestedVenue> list = venues.stream()
                .filter(v -> "Y".equals(v.getVenueAvailability()))
                .sorted((a, b) -> Integer.compare(b.getVenueCapacity(), a.getVenueCapacity()))
                .limit(3)
                .map(v -> SuggestedVenue.builder()
                        .venueId(v.getVenueId())
                        .venueName(v.getVenueName())
                        .venueCapacity(v.getVenueCapacity())
                        .suitabilityScore(0.5)
                        .rank(0)
                        .build())
                .toList();

        // Re-assign ranks
        for (int i = 0; i < list.size(); i++) list.get(i).setRank(i + 1);

        return VenueSuggestionResponse.builder()
                .suggestions(list)
                .category(category)
                .message("Suggestion service unavailable — showing largest venues")
                .build();
    }
}