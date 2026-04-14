package com.eventsphere.backend.repository.h2;

import com.eventsphere.backend.entity.h2.EventMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * H2 repository for EVENT_METADATA table.
 * Uses the secondary (H2) EntityManagerFactory — configured in H2DataSourceConfig.
 */
@Repository
public interface EventMetadataRepository extends JpaRepository<EventMetadata, Long> {

    /** Look up metadata for one specific event. */
    Optional<EventMetadata> findByEventId(String eventId);

    /** Check if metadata already exists before inserting (DataLoader guard). */
    boolean existsByEventId(String eventId);
}