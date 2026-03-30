package com.eventsphere.backend.repository;

import com.eventsphere.backend.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, String>
{
    Optional<Admin> findByAdminUsername(String adminUsername);

    Optional<Admin> findByAdminEmail(String adminEmail);

    boolean existsByAdminEmail(String adminEmail);

    boolean existsByAdminUsername(String adminUsername);

    Optional<Admin> findByAdminEmailIgnoreCase(String adminEmail);
}