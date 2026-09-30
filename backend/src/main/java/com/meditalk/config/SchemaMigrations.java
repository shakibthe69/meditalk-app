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
 * <p>{@code spring.jpa.hibernate.ddl-auto=update} does not always reliably apply
 * <em>new columns</em>: Hibernate may re-issue {@code create table} for tables
 * that already exist (the statements fail with "Table already exists" and are
 * only logged as warnings), and the additive {@code alter table} step is
 * skipped as a result. Any new field therefore never reaches the schema, and the
 * first query selecting it fails with "Column not found".
 *
 * <p>Running the additive DDL explicitly — after checking INFORMATION_SCHEMA so
 * it is safe on every boot and on a fresh database — keeps entity changes
 * working without switching the project away from {@code ddl-auto=update}.
 *
 * <p>Runs before the data initialisers ({@code @Order(0)}).
 */
@Component
@Order(0)
public class SchemaMigrations implements CommandLineRunner, InitializingBean {

    private static final Logger log = LoggerFactory.getLogger(SchemaMigrations.class);

    /** Migration definitions: {table, column, DDL type}. */
    private static final String[][] MIGRATIONS = {
            // Admin monitoring: activity tracking + AI follow-up-call consent.
            {"users", "last_active_at", "TIMESTAMP NULL"},
            {"users", "follow_up_calls_opt_in", "BOOLEAN DEFAULT FALSE"},
            // Doctor post image attachment support
            {"doctor_posts", "image_url", "VARCHAR(1000)"},
            // Uploaded report images are stored verbatim in the database too, so
            // they survive upload-folder cleanup and can be embedded in the PDF.
            {"medical_reports", "file_data", "MEDIUMBLOB"},
            // Admin-initiated support calls carry an admin user id instead of a doctor.
            {"call_sessions", "admin_user_id", "BIGINT"},
    };

    /**
     * Raw, idempotent DDL. Used where a column must be *relaxed* rather than
     * added — Hibernate's {@code ddl-auto=update} never drops a NOT NULL
     * constraint on an existing column.
     */
    private static final String[] RAW_MIGRATIONS = {
            // Admin↔patient calls have no doctor account, so the column must accept NULL.
            "ALTER TABLE call_sessions MODIFY COLUMN doctor_account_id BIGINT NULL",
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
        for (String[] migration : MIGRATIONS) {
            String table = migration[0];
            String column = migration[1];
            String columnType = migration[2];
            try {
                Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                                + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                        Integer.class, table, column);
                if (count != null && count == 0) {
                    String sql = "ALTER TABLE " + table + " ADD COLUMN " + column + " " + columnType;
                    jdbcTemplate.execute(sql);
                    log.info("Schema migration applied: added {}.{}", table, column);
                } else {
                    log.debug("Schema migration skipped (column already exists): {}.{}", table, column);
                }
            } catch (Exception e) {
                // Non-fatal: the table may not exist yet on a fresh database
                // (Hibernate will create it with the column included).
                log.warn("Schema migration skipped ({}.{}): {}", table, column, e.getMessage());
            }
        }
        for (String sql : RAW_MIGRATIONS) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception e) {
                // Non-fatal: the table may not exist yet on a fresh database, where
                // Hibernate will create it with the relaxed definition already.
                log.warn("Raw schema migration skipped ({}): {}", sql, e.getMessage());
            }
        }

        log.info("Schema migrations checked.");
    }
}

