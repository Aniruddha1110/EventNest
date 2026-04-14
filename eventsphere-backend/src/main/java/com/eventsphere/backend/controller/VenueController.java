package com.eventsphere.backend.controller;

import com.eventsphere.backend.dto.response.ApiResponse;
import com.eventsphere.backend.service.VenueService;
import com.eventsphere.backend.dto.request.AddVenueRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueService venueService;

    @GetMapping
    public ResponseEntity<ApiResponse> getAll() {
        return ResponseEntity.ok(ApiResponse.success("Venues fetched", venueService.getAllVenues()));
    }

    @GetMapping("/{venueId}")
    public ResponseEntity<ApiResponse> getOne(@PathVariable String venueId) {
        return ResponseEntity.ok(ApiResponse.success("Venue fetched", venueService.getVenue(venueId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse> add(@Valid @RequestBody AddVenueRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Venue added", venueService.addVenue(req)));
    }

    @PutMapping("/{venueId}")
    public ResponseEntity<ApiResponse> update(@PathVariable String venueId,
                                              @Valid @RequestBody AddVenueRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Venue updated", venueService.updateVenue(venueId, req)));
    }

    @DeleteMapping("/{venueId}")
    public ResponseEntity<ApiResponse> delete(@PathVariable String venueId) {
        venueService.deleteVenue(venueId);
        return ResponseEntity.ok(ApiResponse.success("Venue deleted"));
    }
}