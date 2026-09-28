package com.meditalk.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Idempotent column migrations.
 *
 * <p>{@code spring.jpa.hibernate.ddl-auto=update} does not reliably apply <em>new
 * columns</em> on this H2 file database: Hibernate re-issues {@code create table}
 * for tables that already exist (the statements fail with "Table already exists"
 * and are only logged as warnings), and the additive {@code alter table} step is
 * skipped as a result. Any new field therefore never reaches the schema, and the
 * first query selecting it fails with "Column not found".
 *
 * <p>Running the additive DDL explicitly — with {@code IF NOT EXISTS}, so it is
 * safe on every boot and on a fresh database — keeps entity changes working
 * without switching the project away from {@code ddl-auto=update}.
 *
 * <p>Runs before the data initialisers ({@code @Order(0)}).
 */
@Component
@Order(0)
public class SchemaMigrations implements CommandLineRunner, InitializingBean {

    private static final Logger log = LoggerFactory.getLogger(SchemaMigrations.class);

    /** Additive statements. Each must be safe to run repeatedly. */
    private static final String[] STATEMENTS = {
            // Admin monitoring: activity tracking + AI follow-up-call consent.
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS follow_up_calls_opt_in BOOLEAN DEFAULT FALSE",
            // Doctor post image attachment support
            "ALTER TABLE doctor_posts ADD COLUMN IF NOT EXISTS image_url VARCHAR(1000)",
    };

    private final JdbcTemplate jdbcTemplate;

    public SchemaMigrations(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void afterPropertiesSet() {
        applyMigrations();
    }

    @Override
    public void run(String... args) {
        applyMigrations();
    }

    private synchronized void applyMigrations() {
        for (String statement : STATEMENTS) {
            try {
                jdbcTemplate.execute(statement);
                log.debug("Schema migration applied: {}", statement);
            } catch (Exception e) {
                // Non-fatal: the column may already exist with a different
                // definition, or the table may not exist yet on a fresh import.
                log.warn("Schema migration skipped ({}): {}", statement, e.getMessage());
            }
        }
        log.info("Schema migrations checked.");
    }
}
