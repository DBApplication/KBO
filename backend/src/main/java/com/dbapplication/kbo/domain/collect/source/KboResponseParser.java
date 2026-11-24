package com.dbapplication.kbo.domain.collect.source;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * KBO 게임센터 응답(JSON) → KboGame / BoxScore.
 * 응답 특징 (2025-06-01 실제 응답으로 확인):
 * - 표(table1, table2, arrHitter[].table1~3, arrPitcher[].table, tableEtc)는 JSON 을 문자열로 한 번 더 감싼 값이다.
 * - 표 칸의 Text 에 HTML(&lt;span&gt;, &amp;nbsp;)이 섞여 있다.
 * - 박스스코어에는 선수 ID 가 없고 이름만 있다. 경기 목록의 선발·승·패·세이브 투수만 ID 가 있다.
 */
@Component
public class KboResponseParser {

    private static final JsonMapper JSON = JsonMapper.builder().build();
    private static final DateTimeFormatter YYYYMMDD = DateTimeFormatter.BASIC_ISO_DATE;

    // ---------------------------------------------------------------- 경기 목록
    /** GetKboGameList → 경기 목록 (정규시즌만). */
    public List<KboGame> gameList(String body) {
        JsonNode root = read(body, "경기 목록");
        requireSuccess(root, "경기 목록");
        List<KboGame> games = new ArrayList<>();
        for (JsonNode g : root.path("game")) {
            if (g.path("SR_ID").asInt(-1) != 0) continue; // 시범경기·포스트시즌·올스타는 DB 범위(정규시즌) 밖
            String gameId = text(g, "G_ID");
            if (!gameId.matches("\\d{8}[A-Z]{4}\\d")) throw new KboSourceException("경기 ID 형식이 다릅니다: " + gameId);
            KboGame.State state = state(g);
            boolean scored = state == KboGame.State.FINISHED || state == KboGame.State.IN_PROGRESS;
            games.add(new KboGame(gameId, g.path("SEASON_ID").asInt(), g.path("SR_ID").asInt(),
                    LocalDate.parse(text(g, "G_DT"), YYYYMMDD), time(text(g, "G_TM")),
                    text(g, "AWAY_ID"), text(g, "HOME_ID"), blankToNull(text(g, "S_NM")), state,
                    scored ? integer(text(g, "T_SCORE_CN")) : null, scored ? integer(text(g, "B_SCORE_CN")) : null,
                    pitcherIds(g), text(g, "GAME_STATE_SC")));
        }
        return games;
    }

    /**
     * 상태: CANCEL_SC_ID 가 0 이 아니면 취소(우천취소 1, 기타 99 …).
     * GAME_STATE_SC 1 예정, 2 진행 중, 3 종료, 4 취소. 그 밖의 값은 UNKNOWN (그 경기만 건너뛴다).
     */
    static KboGame.State state(JsonNode g) {
        String cancel = text(g, "CANCEL_SC_ID");
        if (!cancel.isEmpty() && !cancel.equals("0")) return KboGame.State.CANCELED;
        return switch (text(g, "GAME_STATE_SC")) {
            case "1" -> KboGame.State.SCHEDULED;
            case "2" -> KboGame.State.IN_PROGRESS;
            case "3" -> KboGame.State.FINISHED;
            case "4" -> KboGame.State.CANCELED;
            default -> KboGame.State.UNKNOWN;
        };
    }

    /** 경기 목록에만 있는 투수 ID: 선발(원정 T_PIT, 홈 B_PIT)·승·패·세이브. 이름 → ID. */
    private static java.util.Map<String, Integer> pitcherIds(JsonNode g) {
        java.util.Map<String, Integer> ids = new java.util.HashMap<>();
        for (String key : List.of("T_PIT_P", "B_PIT_P", "W_PIT_P", "L_PIT_P", "SV_PIT_P")) {
            JsonNode id = g.path(key + "_ID");
            String name = text(g, key + "_NM");
            if (id.isNumber() && !name.isEmpty()) ids.put(name, id.asInt());
        }
        return ids;
    }

    // ---------------------------------------------------------------- 박스스코어
    /** GetScoreBoardScroll + GetBoxScoreScroll → 한 경기 박스스코어. */
    public BoxScore boxScore(KboGame game, String scoreBoardBody, String boxScoreBody) {
        JsonNode sb = read(scoreBoardBody, "스코어보드");
        JsonNode bx = read(boxScoreBody, "박스스코어");
        requireSuccess(sb, "스코어보드");
        requireSuccess(bx, "박스스코어");
        if (!game.gameId().equals(text(sb, "G_ID"))) {
            throw new KboSourceException("스코어보드 경기 ID 가 다릅니다: " + text(sb, "G_ID"));
        }

        List<List<String>> innings = rows(table(sb, "table2", "스코어보드 이닝"));
        List<List<String>> totals = rows(table(sb, "table3", "스코어보드 R/H/E"));
        if (innings.size() != 2 || totals.size() != 2) throw new KboSourceException("스코어보드 줄 수가 2 가 아닙니다");

        JsonNode hitters = bx.path("arrHitter");
        JsonNode pitchers = bx.path("arrPitcher");
        if (hitters.size() != 2 || pitchers.size() != 2) throw new KboSourceException("박스스코어 팀 수가 2 가 아닙니다");

        return new BoxScore(
                teamLine(text(sb, "AWAY_NM"), innings.get(0), totals.get(0)),
                teamLine(text(sb, "HOME_NM"), innings.get(1), totals.get(1)),
                batters(hitters.get(0)), batters(hitters.get(1)),
                pitchers(pitchers.get(0), game), pitchers(pitchers.get(1), game),
                events(bx, sb));
    }

    private BoxScore.TeamLine teamLine(String name, List<String> innings, List<String> rhe) {
        if (rhe.size() < 3) throw new KboSourceException("R/H/E 칸이 부족합니다");
        return new BoxScore.TeamLine(name, innings, rhe.get(0), rhe.get(1), rhe.get(2),
                rhe.size() > 3 ? rhe.get(3) : "");
    }

    /** arrHitter 한 팀: table1 [타순, 포지션, 선수명], table2 이닝별 결과, table3 [타수, 안타, 타점, 득점, 타율] */
    private List<BoxScore.BatterRow> batters(JsonNode team) {
        List<List<String>> names = rows(table(team, "table1", "타자 이름"));
        List<List<String>> plays = rows(table(team, "table2", "타자 이닝별 결과"));
        List<List<String>> stats = rows(table(team, "table3", "타자 합계"));
        if (names.size() != plays.size() || names.size() != stats.size()) {
            throw new KboSourceException("타자 표 세 개의 줄 수가 다릅니다");
        }
        List<BoxScore.BatterRow> result = new ArrayList<>();
        for (int i = 0; i < names.size(); i++) {
            List<String> n = names.get(i), s = stats.get(i);
            if (n.size() < 3 || s.size() < 4) throw new KboSourceException("타자 표 칸 수가 부족합니다");
            result.add(new BoxScore.BatterRow(n.get(0), n.get(1), n.get(2), null, plays.get(i),
                    s.get(0), s.get(1), s.get(2), s.get(3)));
        }
        return result;
    }

    /** arrPitcher 한 팀. 열은 헤더 이름으로 찾는다 (선수명, 등판, 결과, 이닝, 타자, 투구수, 피안타, 홈런, 4사구, 삼진, 실점, 자책). */
    private List<BoxScore.PitcherRow> pitchers(JsonNode team, KboGame game) {
        JsonNode table = table(team, "table", "투수");
        List<String> header = headers(table);
        List<BoxScore.PitcherRow> result = new ArrayList<>();
        for (List<String> r : rows(table)) {
            String name = col(r, header, "선수명");
            result.add(new BoxScore.PitcherRow(name, game.pitcherIds().get(name), col(r, header, "등판"),
                    col(r, header, "결과"), col(r, header, "이닝"), col(r, header, "타자"), col(r, header, "투구수"),
                    col(r, header, "타수"), col(r, header, "피안타"), col(r, header, "홈런"), col(r, header, "4사구"),
                    col(r, header, "삼진"), col(r, header, "실점"), col(r, header, "자책")));
        }
        return result;
    }

    /**
     * tableEtc 의 [항목, 내용] 줄 + 스코어보드 머리의 경기 정보(구장·관중·개시·종료·경기시간).
     * CSV 로 적재한 경기(data/daily/game_events.csv)와 같은 항목이 되도록 맞춘다.
     */
    private List<BoxScore.EventRow> events(JsonNode bx, JsonNode sb) {
        List<BoxScore.EventRow> result = new ArrayList<>();
        if (!bx.path("tableEtc").isMissingNode() && !bx.path("tableEtc").isNull()) {
            for (List<String> r : rows(table(bx, "tableEtc", "주요 기록"))) {
                if (r.size() >= 2) result.add(new BoxScore.EventRow(r.get(0), r.get(1)));
            }
        }
        String[][] info = {{"구장", "S_NM"}, {"관중", "CROWD_CN"}, {"개시", "START_TM"}, {"종료", "END_TM"},
                {"경기시간", "USE_TM"}};
        for (String[] f : info) {
            String v = text(sb, f[1]);
            if (v != null && !v.isBlank()) result.add(new BoxScore.EventRow(f[0], v.trim()));
        }
        return result;
    }

    // ---------------------------------------------------------------- 공통
    private static JsonNode read(String body, String what) {
        try {
            return JSON.readTree(body);
        } catch (JacksonException e) {
            throw new KboSourceException(what + " 응답이 JSON 이 아닙니다", e);
        }
    }

    private static void requireSuccess(JsonNode root, String what) {
        String code = text(root, "code");
        if (!code.isEmpty() && !code.equals("100")) {
            throw new KboSourceException(what + " 응답 실패: " + code + " " + text(root, "msg"));
        }
    }

    /** 문자열로 감싼 표 JSON 을 한 번 더 읽는다. */
    private static JsonNode table(JsonNode parent, String key, String what) {
        JsonNode v = parent.path(key);
        if (v.isString()) return read(v.asString(), what + " 표");
        if (v.isObject()) return v;
        throw new KboSourceException(what + " 표(" + key + ")가 없습니다");
    }

    /** 표 본문(rows) → 칸 글자 목록. 합계 줄(tfoot)은 rows 에 없다. */
    private static List<List<String>> rows(JsonNode table) {
        List<List<String>> rows = new ArrayList<>();
        for (JsonNode row : table.path("rows")) {
            List<String> cells = new ArrayList<>();
            for (JsonNode cell : row.path("row")) cells.add(cellText(cell.path("Text").asString("")));
            rows.add(cells);
        }
        return rows;
    }

    private static List<String> headers(JsonNode table) {
        List<String> names = new ArrayList<>();
        for (JsonNode row : table.path("headers")) {
            for (JsonNode cell : row.path("row")) names.add(cellText(cell.path("Text").asString("")));
        }
        return names;
    }

    private static String col(List<String> row, List<String> header, String name) {
        int i = header.indexOf(name);
        if (i < 0 || i >= row.size()) throw new KboSourceException("투수 표에 '" + name + "' 열이 없습니다");
        return row.get(i);
    }

    /**
     * 칸 글자 정리: HTML 태그 제거, &amp;nbsp; 같은 엔티티 풀기(두 번 감싼 경우 포함),
     * 한 칸에 타석이 둘이면 줄바꿈(br)을 / 로 바꾼다.
     */
    static String cellText(String raw) {
        String s = raw;
        for (int i = 0; i < 3 && s.contains("&"); i++) s = HtmlUtils.htmlUnescape(s);
        s = s.replaceAll("(?i)<br\\s*/?>", "/").replaceAll("<[^>]*>", "");
        return s.replace(' ', ' ').replaceAll("\\s+", " ").trim();
    }

    private static String text(JsonNode node, String key) {
        JsonNode v = node.path(key);
        return v.isMissingNode() || v.isNull() ? "" : v.asString().trim();
    }

    private static Integer integer(String s) {
        String v = s.replace(",", "").trim();
        if (v.isEmpty()) return null;
        try {
            return Integer.parseInt(v);
        } catch (NumberFormatException e) {
            throw new KboSourceException("숫자가 아닌 점수: " + s);
        }
    }

    private static LocalTime time(String s) {
        return s.matches("\\d{1,2}:\\d{2}") ? LocalTime.parse(s.length() == 4 ? "0" + s : s) : null;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
