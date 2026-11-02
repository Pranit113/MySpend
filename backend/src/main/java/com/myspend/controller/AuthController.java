package com.myspend.controller;

import com.myspend.config.TokenStore;
import com.myspend.dto.LoginRequest;
import com.myspend.dto.LoginResponse;
import com.myspend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/status")
    public Map<String, Boolean> status() {
        return Map.of("hasPassword", authService.hasPassword());
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        try {
            String token = authService.login(req.getPassword());
            return ResponseEntity.ok(LoginResponse.success(token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(LoginResponse.failure(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).body(LoginResponse.failure(e.getMessage()));
        }
    }

    @PostMapping("/setup")
    public ResponseEntity<Map<String, String>> setup(@Valid @RequestBody LoginRequest req) {
        try {
            authService.setup(req.getPassword());
            return ResponseEntity.ok(Map.of("message", "Password set successfully."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        String token = request.getHeader("X-Auth-Token");
        authService.logout(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> body,
                                                               HttpServletRequest request) {
        String current = body.get("currentPassword");
        String next = body.get("newPassword");
        if (current == null || next == null || next.length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 4 characters."));
        }
        try {
            authService.changePassword(current, next);
            // Revoke current token so user must re-login
            TokenStore.revoke(request.getHeader("X-Auth-Token"));
            return ResponseEntity.ok(Map.of("message", "Password changed. Please log in again."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }
}
