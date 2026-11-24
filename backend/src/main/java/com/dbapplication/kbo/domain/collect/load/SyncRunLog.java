package com.dbapplication.kbo.domain.collect.load;

import java.sql.Date;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** kbo_sync_run (V4) 기록. 경기 적재 트랜잭션과 따로 커밋돼서 실패한 실행도 남는다. */
@Component
public class SyncRunLog {

    private final JdbcTemplate jdbc;

    public SyncRunLog(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long start(LocalDate date, String trigger) {
        return jdbc.queryForObject("""
                INSERT INTO kbo_sync_run (target_date, trigger_type, status) VALUES (?, ?, 'RUNNING')
                RETURNING id""", Long.class, Date.valueOf(date), trigger);
    }

    public void finish(long id, String status, int found, int loaded, int updated, int failed, String message) {
        jdbc.update("""
                UPDATE kbo_sync_run
                SET finished_at = now(), status = ?, games_found = ?, games_loaded = ?, games_updated = ?,
                    games_failed = ?, message = ?
                WHERE id = ?""", status, found, loaded, updated, failed, message, id);
    }

    public List<Run> recent(int limit) {
        return jdbc.query("""
                SELECT id, target_date, trigger_type, started_at, finished_at, status, games_found, games_loaded,
                       games_updated, games_failed, message
                FROM kbo_sync_run ORDER BY started_at DESC, id DESC LIMIT ?""",
                (rs, i) -> new Run(rs.getLong("id"), rs.getObject("target_date", LocalDate.class),
                        rs.getString("trigger_type"), rs.getObject("started_at", OffsetDateTime.class),
                        rs.getObject("finished_at", OffsetDateTime.class), rs.getString("status"),
                        rs.getInt("games_found"), rs.getInt("games_loaded"), rs.getInt("games_updated"),
                        rs.getInt("games_failed"), rs.getString("message")),
                limit);
    }

    public record Run(long id, LocalDate targetDate, String triggerType, OffsetDateTime startedAt,
            OffsetDateTime finishedAt, String status, int gamesFound, int gamesLoaded, int gamesUpdated,
            int gamesFailed, String message) {
    }
}
