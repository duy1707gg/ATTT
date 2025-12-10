package com.securevault.security;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

public class SmartPasswordEncoder implements PasswordEncoder {

    private final PasswordEncoder argon2;
    private final PasswordEncoder bcrypt;

    public SmartPasswordEncoder() {
        // Argon2: 16 salt, 32 hash, 1 parallelism, 64MB memory, 3 iterations
        this.argon2 = new Argon2PasswordEncoder(16, 32, 1, 65536, 3);
        this.bcrypt = new BCryptPasswordEncoder();
    }

    @Override
    public String encode(CharSequence rawPassword) {
        // Always encode new passwords with Argon2
        return argon2.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (encodedPassword == null) {
            return false;
        }

        if (encodedPassword.startsWith("$argon2")) {
            return argon2.matches(rawPassword, encodedPassword);
        } else if (encodedPassword.startsWith("$2")) { // $2a$, $2b$, $2y$ (BCrypt)
            return bcrypt.matches(rawPassword, encodedPassword);
        } else {
            // Default fallback (try bcrypt, or fail)
            return bcrypt.matches(rawPassword, encodedPassword);
        }
    }
}
