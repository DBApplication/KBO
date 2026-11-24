package com.dbapplication.kbo.domain.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

/** 선수 상세의 연도별 타격 기록 한 행. */
public record BatterSeasonResponse(
        @Schema(description = "시즌") Integer season,
        @Schema(description = "해당 시즌 소속 팀") TeamSummary team,
        @Schema(description = "시즌 타격 기록") BatterStats stats) {

    public static BatterSeasonResponse from(BatterSeasonRecord r) {
        return new BatterSeasonResponse(r.getSeason(), TeamSummary.from(r.getTeam()), BatterStats.from(r));
    }
}
