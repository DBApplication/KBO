package com.dbapplication.kbo.domain.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

/** 선수 상세의 연도별 투구 기록 한 행. */
public record PitcherSeasonResponse(
        @Schema(description = "시즌") Integer season,
        @Schema(description = "해당 시즌 소속 팀") TeamSummary team,
        @Schema(description = "시즌 투구 기록") PitcherStats stats) {

    public static PitcherSeasonResponse from(PitcherSeasonRecord r) {
        return new PitcherSeasonResponse(r.getSeason(), TeamSummary.from(r.getTeam()), PitcherStats.from(r));
    }
}
