package com.myspend.service;

import com.myspend.dto.*;
import com.myspend.entity.Transaction;
import com.myspend.entity.Transaction.TransactionType;
import com.myspend.repository.SettingsRepository;
import com.myspend.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class TransactionService {

    private final TransactionRepository transactionRepo;
    private final SettingsRepository settingsRepo;

    public TransactionService(TransactionRepository transactionRepo, SettingsRepository settingsRepo) {
        this.transactionRepo = transactionRepo;
        this.settingsRepo = settingsRepo;
    }

    public DashboardResponse getDashboard() {
        var settings = settingsRepo.findFirstBy().orElseGet(this::defaultSettings);
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate monthEnd = now.withDayOfMonth(now.lengthOfMonth());

        BigDecimal totalIncome = transactionRepo.sumByTypeAndDateBetween(TransactionType.INCOME, LocalDate.of(2000, 1, 1), LocalDate.now());
        BigDecimal totalExpense = transactionRepo.sumByTypeAndDateBetween(TransactionType.EXPENSE, LocalDate.of(2000, 1, 1), LocalDate.now());
        BigDecimal monthlyIncome = transactionRepo.sumByTypeAndDateBetween(TransactionType.INCOME, monthStart, monthEnd);
        BigDecimal monthlyExpense = transactionRepo.sumByTypeAndDateBetween(TransactionType.EXPENSE, monthStart, monthEnd);

        BigDecimal availableBalance = settings.getOpeningBalance().add(totalIncome).subtract(totalExpense);
        BigDecimal remainingBudget = settings.getMonthlyBudget().subtract(monthlyExpense);

        List<TransactionResponse> recent = transactionRepo.findTop10ByOrderByTransactionDateDescCreatedAtDesc()
                .stream().map(TransactionResponse::from).toList();

        return new DashboardResponse(availableBalance, monthlyExpense, monthlyIncome,
                settings.getMonthlyBudget(), remainingBudget, settings.getOpeningBalance(), recent);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactions(LocalDate start, LocalDate end, String type) {
        if (start == null) start = LocalDate.of(2000, 1, 1);
        if (end == null) end = LocalDate.now();

        if (type != null && !type.isBlank()) {
            TransactionType t = TransactionType.valueOf(type.toUpperCase());
            return transactionRepo.findByTypeAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(t, start, end)
                    .stream().map(TransactionResponse::from).toList();
        }
        return transactionRepo.findByTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(start, end)
                .stream().map(TransactionResponse::from).toList();
    }

    public TransactionResponse create(TransactionRequest req) {
        Transaction t = new Transaction();
        applyRequest(t, req);
        return TransactionResponse.from(transactionRepo.save(t));
    }

    public TransactionResponse update(Long id, TransactionRequest req) {
        Transaction t = transactionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + id));
        applyRequest(t, req);
        return TransactionResponse.from(transactionRepo.save(t));
    }

    public void delete(Long id) {
        if (!transactionRepo.existsById(id)) {
            throw new IllegalArgumentException("Transaction not found: " + id);
        }
        transactionRepo.deleteById(id);
    }

    private void applyRequest(Transaction t, TransactionRequest req) {
        t.setAmount(req.getAmount());
        t.setType(req.getType());
        t.setCategory(req.getCategory());
        t.setDescription(req.getDescription());
        t.setSource(req.getSource());
        t.setTransactionDate(req.getTransactionDate());
    }

    private com.myspend.entity.Settings defaultSettings() {
        return new com.myspend.entity.Settings();
    }
}
