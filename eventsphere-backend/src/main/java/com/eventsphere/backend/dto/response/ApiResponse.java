package com.eventsphere.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse {

    private boolean success;
    private String  message;
    private Object  data;

    // ── Static factory helpers ─────────────────────────────────────────────────

    public static ApiResponse success(String message, Object data) {
        return ApiResponse.builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static ApiResponse success(String message) {
        return ApiResponse.builder()
                .success(true)
                .message(message)
                .data(null)
                .build();
    }

    public static ApiResponse error(String message) {
        return ApiResponse.builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}