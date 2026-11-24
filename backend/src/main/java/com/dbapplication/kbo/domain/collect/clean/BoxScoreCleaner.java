package com.dbapplication.kbo.domain.collect.clean;

import com.dbapplication.kbo.domain.collect.source.BoxScore;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * 수집한 박스스코어(화면 글자 그대로) → DB 칼럼 값으로 정제한다.
 * 원칙: 빈 값을 0 으로 채우지 않는다. 필수 칼럼이 비어 있거나 숫자가 아니면 예외 → 그 경기는 적재하지 않는다.
 */
@Component
public class BoxScoreCleaner {

    // KBO 박스스코어의 결과 칸은 "승", "패", "세" 와 "홀드" 처럼 한 글자·전체 단어가 섞여 온다.
    private static final Map<String, String> DECISIONS = Map.of(
            "승", "W", "패", "L", "세", "S", "홀", "H", "승리", "W", "패배", "L", "세이브", "S", "홀드", "H");
    // 이닝 표기: "6", "6 1/3", "1/3", "6⅓", "⅔"
    private static final Pattern INNINGS = Pattern.compile("^(\\d+)?\\s*(?:(1/3|⅓)|(2/3|⅔))?$");

    public CleanGame clean(BoxScore box) {
        List<CleanGame.Batter> batters = new ArrayList<>();
        batters.addAll(batters("AWAY", box.awayBatters()));
        batters.addAll(batters("HOME", box.homeBatters()));
        List<CleanGame.Pitcher> pitchers = new ArrayList<>();
        pitchers.addAll(pitchers("AWAY", box.awayPitchers()));
        pitchers.addAll(pitchers("HOME", box.homePitchers()));
        return new CleanGame(team("AWAY", box.away()), team("HOME", box.home()), batters, pitchers,
                events(box.events()));
    }

    CleanGame.TeamTotal team(String side, BoxScore.TeamLine line) {
        List<CleanGame.Inning> innings = new ArrayList<>();
        for (int i = 0; i < line.innings().size(); i++) {
            String v = line.innings().get(i).trim();
            // "-" 는 그 이닝이 없음, "X" 는 9회말 공격 안 함 → 행을 만들지 않는다
            if (v.isEmpty() || v.equals("-") || v.equalsIgnoreCase("X")) continue;
            innings.add(new CleanGame.Inning(i + 1, number(v, side + " " + (i + 1) + "회 득점")));
        }
        return new CleanGame.TeamTotal(side, line.teamName().trim(), innings,
                number(line.runs(), side + " R"), number(line.hits(), side + " H"),
                number(line.errors(), side + " E"), optionalNumber(line.walks()));
    }

    List<CleanGame.Batter> batters(String side, List<BoxScore.BatterRow> rows) {
        List<CleanGame.Batter> result = new ArrayList<>();
        int seq = 0;
        for (BoxScore.BatterRow r : rows) {
            seq++;
            String who = side + " 타자 " + r.name();
            int pa = 0, ab = 0, hits = 0, doubles = 0, triples = 0, hr = 0, bb = 0, hbp = 0, so = 0, sf = 0;
            for (String cell : r.plateResults()) {
                for (PlateResult p : PlateResult.parseCell(cell)) {
                    pa++;
                    if (p.countsAsAtBat()) ab++;
                    if (p.isHit()) hits++;
                    switch (p) {
                        case DOUBLE -> doubles++;
                        case TRIPLE -> triples++;
                        case HOME_RUN -> hr++;
                        case WALK, INTENTIONAL_WALK -> bb++;
                        case HIT_BY_PITCH -> hbp++;
                        case STRIKEOUT -> so++;
                        case SAC_FLY -> sf++;
                        default -> { }
                    }
                }
            }
            // 이닝 칸에서 센 타수·안타가 KBO 합계 칸과 다르면 해석이 틀린 것 → 적재하지 않는다
            int officialAb = number(r.atBats(), who + " 타수");
            int officialHits = number(r.hits(), who + " 안타");
            if (ab != officialAb || hits != officialHits) {
                throw new IllegalArgumentException(String.format(
                        "%s: 이닝별 결과로 센 타수·안타(%d·%d)가 KBO 합계(%d·%d)와 다릅니다", who, ab, hits,
                        officialAb, officialHits));
            }
            result.add(new CleanGame.Batter(side, seq, r.name().trim(), r.kboPlayerId(),
                    optionalNumber(r.battingOrder()), blankToNull(r.position()), pa, ab, hits, doubles,
                    triples, hr, number(r.rbi(), who + " 타점"), number(r.runs(), who + " 득점"), bb, hbp, so, sf));
        }
        return result;
    }

    List<CleanGame.Pitcher> pitchers(String side, List<BoxScore.PitcherRow> rows) {
        List<CleanGame.Pitcher> result = new ArrayList<>();
        int seq = 0;
        for (BoxScore.PitcherRow r : rows) {
            seq++;
            String who = side + " 투수 " + r.name();
            result.add(new CleanGame.Pitcher(side, seq, r.name().trim(), r.kboPlayerId(),
                    "선발".equals(r.appearance().trim()), decision(r.result(), who), outs(r.innings(), who),
                    number(r.battersFaced(), who + " 타자"), optionalNumber(r.pitches()),
                    number(r.hits(), who + " 피안타"), number(r.homeRuns(), who + " 피홈런"),
                    number(r.walksHbp(), who + " 4사구"), number(r.strikeouts(), who + " 삼진"),
                    number(r.runs(), who + " 실점"), number(r.earnedRuns(), who + " 자책")));
        }
        return result;
    }

    List<CleanGame.Event> events(List<BoxScore.EventRow> rows) {
        List<CleanGame.Event> result = new ArrayList<>();
        java.util.Map<String, Integer> counter = new java.util.HashMap<>();
        for (BoxScore.EventRow r : rows) {
            String type = r.type().trim();
            String text = r.description().trim();
            if (type.isEmpty() || text.isEmpty()) continue;
            result.add(new CleanGame.Event(type, counter.merge(type, 1, Integer::sum), text));
        }
        return result;
    }

    /** "6 1/3" → 19 아웃 */
    static int outs(String raw, String what) {
        String v = raw == null ? "" : raw.trim();
        Matcher m = INNINGS.matcher(v);
        if (v.isEmpty() || !m.matches()) throw new IllegalArgumentException(what + " 이닝 값을 읽을 수 없습니다: " + raw);
        int whole = m.group(1) == null ? 0 : Integer.parseInt(m.group(1));
        return whole * 3 + (m.group(2) != null ? 1 : 0) + (m.group(3) != null ? 2 : 0);
    }

    static String decision(String raw, String what) {
        String v = raw == null ? "" : raw.replace("&nbsp;", "").replace('\u00a0', ' ').trim();
        if (v.isEmpty() || v.equals("-")) return null;
        String code = DECISIONS.get(v);
        if (code == null) throw new IllegalArgumentException(what + " 승패 기록을 읽을 수 없습니다: " + raw);
        return code;
    }

    static int number(String raw, String what) {
        Integer v = optionalNumber(raw);
        if (v == null) throw new IllegalArgumentException(what + " 값이 비어 있습니다");
        return v;
    }

    static Integer optionalNumber(String raw) {
        String v = raw == null ? "" : raw.trim().replace(",", "");
        if (v.isEmpty() || v.equals("-")) return null;
        try {
            return Integer.parseInt(v);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("숫자가 아닌 값: " + raw);
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
