package com.dbapplication.kbo.domain.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import com.dbapplication.kbo.domain.player.dto.PlayerDetailResponse;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

public record BatterComparisonItem(
        @Schema(description = "선수 프로필") PlayerDetailResponse player,
        @Schema(description = "해당 시즌 소속 팀") TeamSummary team,
        @Schema(description = "시즌") Integer season,
        @Schema(description = "시즌 타격 기록") BatterStats stats) {

    public static BatterComparisonItem from(BatterSeasonRecord r) {
        return new BatterComparisonItem(PlayerDetailResponse.from(r.getPlayer()), TeamSummary.from(r.getTeam()),
                r.getSeason(), BatterStats.from(r));
    }
}
