package com.eventsphere.backend.repository;

import com.eventsphere.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>
{
    Optional<User> findByUserUsername(String userUsername);

    Optional<User> findByUserEmail(String userEmail);

    Optional<User> findByUserEmailIgnoreCase(String userEmail);

    boolean existsByUserEmail(String userEmail);

    boolean existsByUserUsername(String userUsername);

    List<User> findAll();
}