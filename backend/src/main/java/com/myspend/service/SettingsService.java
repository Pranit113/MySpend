package com.myspend.service;

import com.myspend.dto.SettingsRequest;
import com.myspend.entity.Settings;
import com.myspend.repository.SettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SettingsService {

    private final SettingsRepository settingsRepo;

    public SettingsService(SettingsRepository settingsRepo) {
        this.settingsRepo = settingsRepo;
    }

    @Transactional(readOnly = true)
    public Settings getSettings() {
        return settingsRepo.findFirstBy().orElseGet(Settings::new);
    }

    public Settings updateSettings(SettingsRequest req) {
        Settings settings = settingsRepo.findFirstBy().orElseGet(Settings::new);
        if (req.getMonthlyBudget() != null) settings.setMonthlyBudget(req.getMonthlyBudget());
        if (req.getOpeningBalance() != null) settings.setOpeningBalance(req.getOpeningBalance());
        if (req.getCurrency() != null && !req.getCurrency().isBlank()) settings.setCurrency(req.getCurrency());
        return settingsRepo.save(settings);
    }
}
