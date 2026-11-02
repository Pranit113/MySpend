package com.myspend.repository;

import com.myspend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
            LocalDate start, LocalDate end);

    List<Transaction> findByTypeAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
            Transaction.TransactionType type, LocalDate start, LocalDate end);

    List<Transaction> findTop10ByOrderByTransactionDateDescCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.type = :type AND t.transactionDate BETWEEN :start AND :end")
    BigDecimal sumByTypeAndDateBetween(
            @Param("type") Transaction.TransactionType type,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    List<Transaction> findByTransactionDateBetweenOrderByTransactionDateAsc(LocalDate start, LocalDate end);
}
