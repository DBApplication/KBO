package com.dbapplication.kbo.domain.collect.load;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * DB 에 저장된 정규시즌 경기 결과(matches, FINISHED)로 팀 순위를 다시 계산해서 team_season_record 에 넣는다.
 * 기준일(as_of_date)은 그 시즌에 끝난 마지막 경기 날짜. 같은 기준일 행이 있으면 갱신한다.
 * 승률 = 승 ÷ (승 + 패), 무승부 제외 (KBO 규정). 게임 차는 1위와의 차이.
 * 승률이 같으면 승수가 많은 팀, 그래도 같으면 팀 코드 순 (상대 전적 같은 KBO 세부 동률 규정은 반영하지 않는다).
 */
@Component
public class StandingsWriter {

    private final JdbcTemplate jdbc;

    public StandingsWriter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** 순위를 계산해서 저장하고 기준일을 돌려준다. 끝난 경기가 없으면 null. */
    public LocalDate refresh(int season) {
        LocalDate asOf = jdbc.queryForObject(
                "SELECT max(match_date) FROM matches WHERE season = ? AND status = 'FINISHED'", LocalDate.class,
                season);
        if (asOf == null) return null;

        Map<Long, Line> lines = new LinkedHashMap<>();
        jdbc.query("""
                SELECT match_date, match_time, doubleheader, home_team_id, away_team_id, home_score, away_score
                FROM matches
                WHERE season = ? AND status = 'FINISHED' AND home_score IS NOT NULL AND away_score IS NOT NULL
                ORDER BY match_date, doubleheader, match_time, id""", rs -> {
            long home = rs.getLong("home_team_id"), away = rs.getLong("away_team_id");
            int hs = rs.getInt("home_score"), as = rs.getInt("away_score");
            lines.computeIfAbsent(home, Line::new).add(Integer.compare(hs, as));
            lines.computeIfAbsent(away, Line::new).add(Integer.compare(as, hs));
        }, season);

        List<Line> ranked = new ArrayList<>(lines.values());
        ranked.sort(Comparator.comparing(Line::pct).reversed().thenComparing(l -> -l.wins)
                .thenComparing(l -> l.teamId));
        Line leader = ranked.get(0);
        int rank = 0;
        for (Line l : ranked) {
            rank++;
            BigDecimal gb = BigDecimal.valueOf((leader.wins - l.wins) + (l.losses - leader.losses))
                    .divide(BigDecimal.valueOf(2), 1, RoundingMode.UNNECESSARY);
            jdbc.update("""
                    INSERT INTO team_season_record (team_id, season, as_of_date, team_rank, games, wins, losses,
                                                    draws, win_pct, games_behind, last10, streak)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (team_id, season, as_of_date) DO UPDATE
                        SET team_rank = EXCLUDED.team_rank, games = EXCLUDED.games, wins = EXCLUDED.wins,
                            losses = EXCLUDED.losses, draws = EXCLUDED.draws, win_pct = EXCLUDED.win_pct,
                            games_behind = EXCLUDED.games_behind, last10 = EXCLUDED.last10,
                            streak = EXCLUDED.streak""",
                    l.teamId, season, Date.valueOf(asOf), rank, l.results.size(), l.wins, l.losses, l.draws,
                    l.pct(), l == leader ? null : gb, l.last10(), l.streak());
        }
        return asOf;
    }

    /** 한 팀의 경기 결과 줄 (1 승, 0 무, -1 패) */
    private static final class Line {
        final long teamId;
        final List<Integer> results = new ArrayList<>();
        int wins, losses, draws;

        Line(long teamId) {
            this.teamId = teamId;
        }

        void add(int r) {
            results.add(r);
            if (r > 0) wins++;
            else if (r < 0) losses++;
            else draws++;
        }

        BigDecimal pct() {
            if (wins + losses == 0) return BigDecimal.ZERO.setScale(3);
            return BigDecimal.valueOf(wins).divide(BigDecimal.valueOf(wins + losses), 3, RoundingMode.HALF_UP);
        }

        /** 예: 4승0무6패 */
        String last10() {
            List<Integer> last = results.subList(Math.max(0, results.size() - 10), results.size());
            long w = last.stream().filter(r -> r > 0).count(), d = last.stream().filter(r -> r == 0).count();
            return w + "승" + d + "무" + (last.size() - w - d) + "패";
        }

        /** 예: 3패, 2승, 1무 */
        String streak() {
            int last = results.get(results.size() - 1), n = 0;
            for (int i = results.size() - 1; i >= 0 && results.get(i) == last; i--) n++;
            return n + (last > 0 ? "승" : last < 0 ? "패" : "무");
        }
    }
}
