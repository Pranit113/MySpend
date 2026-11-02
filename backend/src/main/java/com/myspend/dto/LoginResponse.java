package com.myspend.dto;

public class LoginResponse {
    private final String token;
    private final String error;

    public LoginResponse(String token, String error) {
        this.token = token;
        this.error = error;
    }

    public static LoginResponse success(String token) {
        return new LoginResponse(token, null);
    }

    public static LoginResponse failure(String error) {
        return new LoginResponse(null, error);
    }

    public String getToken() { return token; }
    public String getError() { return error; }
}
