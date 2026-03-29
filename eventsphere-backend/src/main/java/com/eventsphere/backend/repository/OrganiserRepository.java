package com.eventsphere.backend.repository;

import com.eventsphere.backend.entity.Organiser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganiserRepository extends JpaRepository<Organiser, String>
{
    Optional<Organiser> findByOrganiserUsername(String organiserUsername);

    Optional<Organiser> findByOrganiserEmail(String organiserEmail);

    Optional<Organiser> findByOrganiserEmailIgnoreCase(String organiserEmail);

    boolean existsByOrganiserEmail(String organiserEmail);

    boolean existsByOrganiserUsername(String organiserUsername);
}