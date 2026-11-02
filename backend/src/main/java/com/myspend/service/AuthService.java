package com.myspend.service;

import com.myspend.config.TokenStore;
import com.myspend.entity.Settings;
import com.myspend.repository.SettingsRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final SettingsRepository settingsRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(SettingsRepository settingsRepo) {
        this.settingsRepo = settingsRepo;
    }

    @Transactional(readOnly = true)
    public boolean hasPassword() {
        return settingsRepo.findFirstBy()
                .map(s -> s.getAppPassword() != null && !s.getAppPassword().isBlank())
                .orElse(false);
    }

    public String login(String rawPassword) {
        Settings settings = settingsRepo.findFirstBy()
                .orElseThrow(() -> new IllegalStateException("No password configured. Please set up a password first."));

        if (settings.getAppPassword() == null || !encoder.matches(rawPassword, settings.getAppPassword())) {
            throw new IllegalArgumentException("Incorrect password.");
        }

        return TokenStore.create();
    }

    public void setup(String rawPassword) {
        Settings settings = settingsRepo.findFirstBy().orElseGet(Settings::new);
        if (settings.getAppPassword() != null && !settings.getAppPassword().isBlank()) {
            throw new IllegalStateException("Password is already set. Use the change password option.");
        }
        settings.setAppPassword(encoder.encode(rawPassword));
        settingsRepo.save(settings);
    }

    public void changePassword(String currentPassword, String newPassword) {
        Settings settings = settingsRepo.findFirstBy()
                .orElseThrow(() -> new IllegalStateException("No password configured."));

        if (!encoder.matches(currentPassword, settings.getAppPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        settings.setAppPassword(encoder.encode(newPassword));
        settingsRepo.save(settings);
    }

    public void logout(String token) {
        TokenStore.revoke(token);
    }
}
