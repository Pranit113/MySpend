package com.myspend.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardResponse {

    private BigDecimal availableBalance;
    private BigDecimal monthlyExpenses;
    private BigDecimal monthlyIncome;
    private BigDecimal monthlyBudget;
    private BigDecimal remainingBudget;
    private BigDecimal openingBalance;
    private List<TransactionResponse> recentTransactions;

    public DashboardResponse(BigDecimal availableBalance, BigDecimal monthlyExpenses,
                             BigDecimal monthlyIncome, BigDecimal monthlyBudget,
                             BigDecimal remainingBudget, BigDecimal openingBalance,
                             List<TransactionResponse> recentTransactions) {
        this.availableBalance = availableBalance;
        this.monthlyExpenses = monthlyExpenses;
        this.monthlyIncome = monthlyIncome;
        this.monthlyBudget = monthlyBudget;
        this.remainingBudget = remainingBudget;
        this.openingBalance = openingBalance;
        this.recentTransactions = recentTransactions;
    }

    public BigDecimal getAvailableBalance() { return availableBalance; }
    public BigDecimal getMonthlyExpenses() { return monthlyExpenses; }
    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public BigDecimal getMonthlyBudget() { return monthlyBudget; }
    public BigDecimal getRemainingBudget() { return remainingBudget; }
    public BigDecimal getOpeningBalance() { return openingBalance; }
    public List<TransactionResponse> getRecentTransactions() { return recentTransactions; }
}
