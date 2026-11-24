package com.dbapplication.kbo.domain.collect.load;

import com.dbapplication.kbo.domain.collect.clean.CleanGame;
import com.dbapplication.kbo.domain.collect.source.KboGame;
import java.sql.Date;
import java.sql.Time;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 정제·검증이 끝난 경기를 V1~V3 테이블에 쓴다. 호출하는 쪽(KboSyncService)이 경기 하나를 트랜잭션 하나로 묶는다.
 * - matches: kbo_game_id 로 찾아서 있으면 갱신, 없으면 추가 (UNIQUE uq_matches_kbo_game_id)
 * - 경기 하위 기록(팀 R/H/E, 이닝 점수, 타자·투수 기록, 주요 기록): 그 경기 행을 지우고 다시 넣는다
 *   → 같은 날짜를 몇 번 다시 수집해도 결과가 같다.
 */
@Component
public class BoxScoreWriter {

    private final JdbcTemplate jdbc;

    public BoxScoreWriter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** KBO 팀 코드(OB, WO …) → team.id. 없는 코드면 예외. */
    public long teamId(String code) {
        List<Long> ids = jdbc.queryForList("SELECT id FROM team WHERE code = ?", Long.class, code);
        if (ids.isEmpty()) throw new IllegalArgumentException("DB 에 없는 팀 코드: " + code);
        return ids.get(0);
    }

    /** 이미 종료 경기로 박스스코어까지 저장했는지 (실시간 갱신에서 같은 경기를 다시 받지 않으려고). */
    public boolean hasFinishedBoxScore(String kboGameId) {
        Boolean stored = jdbc.queryForObject("""
                SELECT EXISTS (SELECT 1 FROM matches m JOIN match_team_record t ON t.match_id = m.id
                               WHERE m.kbo_game_id = ? AND m.status = 'FINISHED')
                """, Boolean.class, kboGameId);
        return Boolean.TRUE.equals(stored);
    }

    /** 경기 한 줄을 넣거나 갱신하고 matches.id 를 돌려준다. 점수는 종료·진행 경기만 저장한다. */
    public long upsertMatch(KboGame g) {
        boolean scored = g.state() == KboGame.State.FINISHED || g.state() == KboGame.State.IN_PROGRESS;
        return jdbc.queryForObject("""
                INSERT INTO matches (kbo_game_id, season, match_date, match_time, home_team_id, away_team_id,
                                     home_score, away_score, stadium, status, doubleheader)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (kbo_game_id) DO UPDATE
                    SET match_date = EXCLUDED.match_date, match_time = EXCLUDED.match_time,
                        home_score = EXCLUDED.home_score, away_score = EXCLUDED.away_score,
                        stadium = COALESCE(EXCLUDED.stadium, matches.stadium), status = EXCLUDED.status
                RETURNING id
                """, Long.class,
                g.kboGameId(), g.date().getYear(), Date.valueOf(g.date()),
                g.time() == null ? null : Time.valueOf(g.time()),
                teamId(g.homeCode()), teamId(g.awayCode()),
                scored ? g.homeScore() : null, scored ? g.awayScore() : null,
                g.stadium(), g.state().name(), g.doubleheader());
    }

    /** 경기 하위 기록을 모두 바꿔 넣는다. 적재한 행 수(타자+투수+주요 기록)를 돌려준다. */
    public int replaceBoxScore(long matchId, KboGame g, CleanGame c) {
        for (String table : List.of("match_team_record", "match_inning_score", "batter_match_record",
                "pitcher_match_record", "match_event")) {
            jdbc.update("DELETE FROM " + table + " WHERE match_id = ?", matchId);
        }
        Map<String, Long> teamBySide = Map.of("HOME", teamId(g.homeCode()), "AWAY", teamId(g.awayCode()));
        int season = g.date().getYear();

        for (CleanGame.TeamTotal t : List.of(c.away(), c.home())) {
            jdbc.update("""
                    INSERT INTO match_team_record (match_id, team_id, home_away, runs, hits, errors, bb_hbp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    matchId, teamBySide.get(t.side()), t.side(), t.runs(), t.hits(), t.errors(), t.bbHbp());
            jdbc.batchUpdate("INSERT INTO match_inning_score (match_id, home_away, inning, runs) VALUES (?, ?, ?, ?)",
                    t.innings().stream().map(i -> new Object[] {matchId, t.side(), i.inning(), i.runs()}).toList());
        }

        PlayerResolver players = new PlayerResolver(season);
        jdbc.batchUpdate("""
                INSERT INTO batter_match_record (match_id, team_id, home_away, seq, player_id, player_name,
                    batting_order, position, pa, ab, hits, doubles, triples, home_runs, rbi, runs, walks,
                    hit_by_pitch, strikeouts, sac_flies)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                c.batters().stream().map(b -> new Object[] {
                        matchId, teamBySide.get(b.side()), b.side(), b.seq(),
                        players.find(b.kboPlayerId(), b.name(), teamBySide.get(b.side())), b.name(),
                        b.battingOrder(), b.position(), b.pa(), b.ab(), b.hits(), b.doubles(), b.triples(),
                        b.homeRuns(), b.rbi(), b.runs(), b.walks(), b.hitByPitch(), b.strikeouts(), b.sacFlies()})
                        .toList());
        jdbc.batchUpdate("""
                INSERT INTO pitcher_match_record (match_id, team_id, home_away, seq, player_id, player_name,
                    is_starter, decision, outs, batters_faced, pitches, hits_allowed, home_runs_allowed, bb_hbp,
                    strikeouts, runs_allowed, earned_runs)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                c.pitchers().stream().map(p -> new Object[] {
                        matchId, teamBySide.get(p.side()), p.side(), p.seq(),
                        players.find(p.kboPlayerId(), p.name(), teamBySide.get(p.side())), p.name(),
                        p.starter(), p.decision(), p.outs(), p.battersFaced(), p.pitches(), p.hitsAllowed(),
                        p.homeRunsAllowed(), p.bbHbp(), p.strikeouts(), p.runsAllowed(), p.earnedRuns()})
                        .toList());
        jdbc.batchUpdate("INSERT INTO match_event (match_id, event_type, item_no, description) VALUES (?, ?, ?, ?)",
                c.events().stream().map(e -> new Object[] {matchId, e.type(), e.itemNo(), e.description()}).toList());
        return c.batters().size() + c.pitchers().size() + c.events().size();
    }

    /**
     * 기록 한 줄을 player.id 와 연결한다. 추측해서 연결하지 않는다.
     * 1) KBO 선수 ID 가 있으면 player.kbo_player_id 로 찾는다.
     * 2) 없으면 같은 팀(현재 소속 또는 그 시즌 기록의 팀)에서 이름이 같은 선수가 정확히 1명일 때만 연결한다.
     * 3) 그 밖에는 NULL (화면은 이름만 보여 주고 선수 상세로 연결하지 않는다).
     */
    private final class PlayerResolver {
        private final int season;
        private final Map<String, Long> cache = new HashMap<>();

        PlayerResolver(int season) {
            this.season = season;
        }

        Long find(Integer kboPlayerId, String name, long teamId) {
            if (kboPlayerId != null) {
                List<Long> ids = jdbc.queryForList("SELECT id FROM player WHERE kbo_player_id = ?", Long.class,
                        kboPlayerId);
                if (!ids.isEmpty()) return ids.get(0);
            }
            return cache.computeIfAbsent(teamId + "|" + name, k -> {
                List<Long> ids = jdbc.queryForList("""
                        SELECT DISTINCT p.id FROM player p
                        WHERE p.name = ?
                          AND (p.team_id = ?
                               OR EXISTS (SELECT 1 FROM batter_season_record b
                                          WHERE b.player_id = p.id AND b.team_id = ? AND b.season = ?)
                               OR EXISTS (SELECT 1 FROM pitcher_season_record r
                                          WHERE r.player_id = p.id AND r.team_id = ? AND r.season = ?))""",
                        Long.class, name, teamId, teamId, season, teamId, season);
                return ids.size() == 1 ? ids.get(0) : null;
            });
        }
    }
}
