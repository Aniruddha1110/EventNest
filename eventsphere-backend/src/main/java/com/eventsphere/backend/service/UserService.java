// ─── UserService.java ─────────────────────────────────────────────────────────
package com.eventsphere.backend.service;

import com.eventsphere.backend.dto.request.UpdateUserRequest;
import com.eventsphere.backend.dto.response.UserResponse;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.exception.ResourceNotFoundException;
import com.eventsphere.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getProfile(String userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        return toResponse(u);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional("oracleTransactionManager")
    public UserResponse updateUser(String userId, UpdateUserRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        if (req.getUserFirstName() != null) user.setUserFirstName(req.getUserFirstName());
        if (req.getUserLastName()  != null) user.setUserLastName(req.getUserLastName());
        if (req.getUserEmail()     != null) user.setUserEmail(req.getUserEmail());
        if (req.getUserPhoneNo()   != null) user.setUserPhoneNo(req.getUserPhoneNo());
        if (req.getUserUsername()  != null) user.setUserUsername(req.getUserUsername());
        User saved = userRepository.save(user);
        log.info("User updated by admin: userId={}", userId);
        return toResponse(saved);
    }

    @Transactional("oracleTransactionManager")
    public void deleteUser(String userId) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new com.eventsphere.backend.exception.ResourceNotFoundException("User not found: " + userId));
        userRepository.delete(u);
    }

    public UserResponse toResponse(User u) {
        return UserResponse.builder()
                .userId(u.getUserId())
                .userFirstName(u.getUserFirstName())
                .userLastName(u.getUserLastName())
                .userEmail(u.getUserEmail())
                .userPhoneNo(u.getUserPhoneNo())
                .userUsername(u.getUserUsername())
                .build();
    }
}