package com.dbapplication.kbo.domain.match.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 홈 화면 "일별 선수 기록": 그 날짜 모든 경기의 타자·투수 기록.
 * 박스스코어를 수집하지 않은 날짜면 두 목록이 비어 있다.
 */
public record DailyPlayerRecordsResponse(
        LocalDate date,
        List<BatterGameRecordResponse> batters,
        List<PitcherGameRecordResponse> pitchers) {
}
