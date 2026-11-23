package com.dbapplication.kbo.domain.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import com.dbapplication.kbo.domain.player.dto.PlayerDetailResponse;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

public record PitcherComparisonItem(
        @Schema(description = "선수 프로필") PlayerDetailResponse player,
        @Schema(description = "해당 시즌 소속 팀") TeamSummary team,
        @Schema(description = "시즌") Integer season,
        @Schema(description = "시즌 투구 기록") PitcherStats stats) {

    public static PitcherComparisonItem from(PitcherSeasonRecord r) {
        return new PitcherComparisonItem(PlayerDetailResponse.from(r.getPlayer()), TeamSummary.from(r.getTeam()),
                r.getSeason(), PitcherStats.from(r));
    }
}
