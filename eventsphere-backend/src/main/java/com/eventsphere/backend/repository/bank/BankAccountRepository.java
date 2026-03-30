package com.eventsphere.backend.repository.bank;

import com.eventsphere.backend.entity.bank.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long>
{
    Optional<BankAccount> findByUserId(String userId);

    boolean existsByUserId(String userId);
}