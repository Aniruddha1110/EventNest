package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.response.UserResponse;
import com.eventsphere.backend.entity.OAuthUser;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.OAuthUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service for OAuthUser — handles Google/GitHub OAuth2 users stored in OAUTH_USERS.
 *
 * Returns UserResponse (same DTO as regular users) so the frontend
 * works transparently whether the logged-in user is U-XXXX or OAU-XXXX.
 *
 * Field mapping to UserResponse:
 *   userId       → oauthUserId   (e.g. "OAU-0001")
 *   userFirstName → oauthFirstName
 *   userLastName  → oauthLastName
 *   userEmail     → oauthEmail
 *   userPhoneNo   → null         (OAuth2 doesn't provide phone)
 *   userUsername  → oauthUsername (auto-generated from email prefix)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OAuthUserService {

    private final OAuthUserRepository oauthUserRepository;

    /** Called by UserController when userId starts with "OAU-" */
    public UserResponse getProfile(String oauthUserId) {
        OAuthUser u = oauthUserRepository.findById(oauthUserId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OAuth user not found: " + oauthUserId));
        return toUserResponse(u);
    }

    public List<UserResponse> getAllOAuthUsers() {
        return oauthUserRepository.findAll().stream()
                .map(this::toUserResponse)
                .toList();
    }

    /** Maps OAuthUser → UserResponse (same DTO the frontend already reads). */
    public UserResponse toUserResponse(OAuthUser u) {
        return UserResponse.builder()
                .userId(u.getOauthUserId())
                .userFirstName(u.getOauthFirstName())
                .userLastName(u.getOauthLastName())
                .userEmail(u.getOauthEmail())
                .userPhoneNo(u.getOauthPhoneNo())       // null — OAuth2 doesn't provide phone
                .userUsername(u.getOauthUsername())
                .build();
    }
}