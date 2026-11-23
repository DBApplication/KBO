package com.dbapplication.kbo.domain.match.dto;

import java.util.List;

/**
 * 경기 상세 화면.
 *
 * @param scoreboard 박스스코어를 수집하지 않은 경기면 null → 화면은 "미수집" 상태를 보여 준다
 * @param events     경기 주요 기록 (결승타·홈런·실책·심판 등). 미수집이면 빈 목록
 * @param batters    출전 타자 (원정 → 홈, 박스스코어 순서). 미수집이면 빈 목록
 * @param pitchers   등판 투수 (원정 → 홈, 등판 순서). 미수집이면 빈 목록
 */
public record MatchDetailResponse(
        MatchSummaryResponse match,
        List<HighlightResponse> highlights,
        ScoreboardResponse scoreboard,
        List<MatchEventResponse> events,
        List<BatterGameRecordResponse> batters,
        List<PitcherGameRecordResponse> pitchers
) {
}
