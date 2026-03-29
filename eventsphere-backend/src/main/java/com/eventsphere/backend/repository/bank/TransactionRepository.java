package com.eventsphere.backend.repository.bank;

import com.eventsphere.backend.entity.bank.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String>
{
    List<Transaction> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Transaction> findByUserIdAndEventId(String userId, String eventId);

    List<Transaction> findByUserIdAndEventIdAndStatus(
            String userId, String eventId, String status);

    long countByStatus(String status);

    long countByMethod(String method);
}