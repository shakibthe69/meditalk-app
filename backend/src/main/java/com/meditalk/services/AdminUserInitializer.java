package com.meditalk.services;

import com.meditalk.entities.User;
import com.meditalk.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the single administrator account used to sign in to the Admin Panel.
 *
 * <p>Credentials come from configuration/environment ({@code ADMIN_EMAIL} /
 * {@code ADMIN_PASSWORD}) and are never sent to the mobile client — the app
 * only ever receives the JWT and the role string.
 *
 * <p>Runs last ({@code @Order(3)}) so it never interferes with the demo data
 * initialisers, and is idempotent: an existing admin is left untouched.
 */
@Component
@Order(3)
public class AdminUserInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@meditalk.com}")
    private String adminEmail;

    @Value("${app.admin.password:AdminPass123!}")
    private String adminPassword;

    public AdminUserInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        String email = adminEmail == null ? "" : adminEmail.trim().toLowerCase();
        if (email.isEmpty()) {
            return;
        }

        if (userRepository.existsByEmail(email)) {
            // Never downgrade an existing account's role.
            log.debug("Admin account already present: {}", email);
            return;
        }

        User admin = User.builder()
                .fullName("Meditalk Administrator")
                .email(email)
                .password(passwordEncoder.encode(adminPassword == null ? "AdminPass123!" : adminPassword))
                .role("ROLE_ADMIN")
                .build();

        userRepository.save(admin);
        log.info("Administrator account seeded: {}", email);
    }
}
