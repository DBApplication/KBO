package com.dbapplication.kbo.domain.collect.clean;

import java.util.List;

/**
 * 정제가 끝나서 DB 칼럼에 그대로 들어갈 수 있는 한 경기 박스스코어.
 * 비율 기록(타율·OPS·ERA)은 저장하지 않는 원칙대로 여기에도 없다.
 */
public record CleanGame(
        TeamTotal away,
        TeamTotal home,
        List<Batter> batters,
        List<Pitcher> pitchers,
        List<Event> events) {

    /** side 는 HOME / AWAY. innings 는 실제로 공격한 이닝만 (9회말 X 는 없음). */
    public record TeamTotal(String side, String teamName, List<Inning> innings, int runs, int hits,
            int errors, Integer bbHbp) {
    }

    public record Inning(int inning, int runs) {
    }

    public record Batter(String side, int seq, String name, Integer kboPlayerId, Integer battingOrder,
            String position, int pa, int ab, int hits, int doubles, int triples, int homeRuns, int rbi, int runs,
            int walks, int hitByPitch, int strikeouts, int sacFlies) {
    }

    public record Pitcher(String side, int seq, String name, Integer kboPlayerId, boolean starter,
            String decision, int outs, int battersFaced, Integer pitches, int hitsAllowed, int homeRunsAllowed,
            int bbHbp, int strikeouts, int runsAllowed, int earnedRuns) {
    }

    public record Event(String type, int itemNo, String description) {
    }
}
