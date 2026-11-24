package com.dbapplication.kbo.domain.match.dto;

import java.util.List;

/**
 * 경기 상세 화면.
 *
 * @param scoreboard 박스스코어를 수집하지 않은 경기면 null → 화면은 "미수집" 상태를 보여 준다
 */
public record MatchDetailResponse(
        MatchSummaryResponse match,
        List<HighlightResponse> highlights,
        ScoreboardResponse scoreboard
) {
}
