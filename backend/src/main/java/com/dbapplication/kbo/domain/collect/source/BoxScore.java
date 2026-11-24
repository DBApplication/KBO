package com.dbapplication.kbo.domain.collect.source;

import java.util.List;

/**
 * KBO 게임센터 스코어보드 + 박스스코어를 표 그대로 옮긴 값. 숫자 해석·정제는 clean 패키지에서 한다.
 * 문자열 칸은 KBO 화면에 보이는 글자 그대로이고, 칸이 비어 있으면 빈 문자열이다.
 */
public record BoxScore(
        TeamLine away,
        TeamLine home,
        List<BatterRow> awayBatters,
        List<BatterRow> homeBatters,
        List<PitcherRow> awayPitchers,
        List<PitcherRow> homePitchers,
        List<EventRow> events) {

    /** 스코어보드 한 줄. innings 는 1회부터, 공격하지 않은 이닝은 "-" 또는 "X" 등 그대로. */
    public record TeamLine(String teamName, List<String> innings, String runs, String hits, String errors,
            String walks) {
    }

    /** 타자 기록 한 줄. plateResults 는 이닝 칸 글자 그대로 (빈 칸 포함, 1회부터). */
    public record BatterRow(String battingOrder, String position, String name, Integer kboPlayerId,
            List<String> plateResults, String atBats, String hits, String rbi, String runs) {
    }

    /** 투수 기록 한 줄. KBO 표의 열 이름 순서와 같다. */
    public record PitcherRow(String name, Integer kboPlayerId, String appearance, String result,
            String innings, String battersFaced, String pitches, String atBats, String hits, String homeRuns,
            String walksHbp, String strikeouts, String runs, String earnedRuns) {
    }

    /** 경기 주요 기록 (결승타, 홈런, 2루타, 실책, 심판 등) */
    public record EventRow(String type, String description) {
    }
}
