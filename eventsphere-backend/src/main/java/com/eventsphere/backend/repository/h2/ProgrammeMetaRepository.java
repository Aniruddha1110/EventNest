package com.eventsphere.backend.repository.h2;

import com.eventsphere.backend.entity.h2.ProgrammeMeta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * H2 repository for PROGRAMME_META table.
 * Uses the secondary (H2) EntityManagerFactory — configured in H2DataSourceConfig.
 */
@Repository
public interface ProgrammeMetaRepository extends JpaRepository<ProgrammeMeta, Long> {

    /** Look up price and seat count for one programme. */
    Optional<ProgrammeMeta> findByProgrammeId(String programmeId);

    /** DataLoader guard — don't re-insert on restart if already seeded. */
    boolean existsByProgrammeId(String programmeId);

    /**
     * Atomically increment seatsBooked by 1.
     * Called by BankService on every successful payment.
     * Uses @Modifying + @Query to avoid a read-then-write race condition.
     */
    @Modifying
    @Transactional("h2TransactionManager")
    @Query("UPDATE ProgrammeMeta p SET p.seatsBooked = p.seatsBooked + 1 WHERE p.programmeId = :programmeId")
    void incrementSeatsBooked(String programmeId);
}