package com.myspend.dto;

import com.myspend.entity.Transaction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TransactionResponse {

    private Long id;
    private BigDecimal amount;
    private Transaction.TransactionType type;
    private String category;
    private String description;
    private String source;
    private LocalDate transactionDate;
    private LocalDateTime createdAt;

    public static TransactionResponse from(Transaction t) {
        TransactionResponse r = new TransactionResponse();
        r.id = t.getId();
        r.amount = t.getAmount();
        r.type = t.getType();
        r.category = t.getCategory();
        r.description = t.getDescription();
        r.source = t.getSource();
        r.transactionDate = t.getTransactionDate();
        r.createdAt = t.getCreatedAt();
        return r;
    }

    public Long getId() { return id; }
    public BigDecimal getAmount() { return amount; }
    public Transaction.TransactionType getType() { return type; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public String getSource() { return source; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
