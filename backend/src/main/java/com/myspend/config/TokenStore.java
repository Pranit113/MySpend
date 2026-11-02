package com.myspend.config;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public final class TokenStore {

    private static final Set<String> TOKENS = ConcurrentHashMap.newKeySet();

    private TokenStore() {}

    public static String create() {
        String token = UUID.randomUUID().toString();
        TOKENS.add(token);
        return token;
    }

    public static boolean isValid(String token) {
        return token != null && TOKENS.contains(token);
    }

    public static void revoke(String token) {
        if (token != null) TOKENS.remove(token);
    }
}
