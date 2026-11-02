package com.myspend.dto;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public class SettingsRequest {

    @DecimalMin(value = "0", message = "Monthly budget cannot be negative")
    private BigDecimal monthlyBudget;

    @DecimalMin(value = "0", message = "Opening balance cannot be negative")
    private BigDecimal openingBalance;

    private String currency;

    public BigDecimal getMonthlyBudget() { return monthlyBudget; }
    public void setMonthlyBudget(BigDecimal monthlyBudget) { this.monthlyBudget = monthlyBudget; }

    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
