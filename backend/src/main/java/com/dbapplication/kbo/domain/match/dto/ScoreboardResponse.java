package com.dbapplication.kbo.domain.match.dto;

import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import java.util.List;

/**
 * 경기 상세의 이닝별 기록표 (1 ~ N회 + R/H/E).
 *
 * @param innings 표에 그릴 이닝 수. 최소 9, 연장이면 그만큼 늘어난다
 */
public record ScoreboardResponse(int innings, Line away, Line home) {

    /**
     * @param scores 이닝별 득점. 공격하지 않은 이닝은 홈팀 마지막 이닝이면 "X", 그 밖에는 null
     */
    public record Line(TeamSummary team, List<String> scores, int runs, int hits,
            int errors) {
    }
}
