package com.myspend.controller;

import com.myspend.dto.SettingsRequest;
import com.myspend.entity.Settings;
import com.myspend.service.SettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService service;

    public SettingsController(SettingsService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Settings> get() {
        return ResponseEntity.ok(service.getSettings());
    }

    @PutMapping
    public ResponseEntity<Settings> update(@Valid @RequestBody SettingsRequest req) {
        return ResponseEntity.ok(service.updateSettings(req));
    }
}
