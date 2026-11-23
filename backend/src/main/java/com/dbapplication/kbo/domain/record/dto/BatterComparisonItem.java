package com.dbapplication.kbo.domain.record.dto;

import com.dbapplication.kbo.domain.player.dto.PlayerDetailResponse;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

public record BatterComparisonItem(PlayerDetailResponse player, TeamSummary team, Integer season,
                                   BatterStats stats) {

    public static BatterComparisonItem from(BatterSeasonRecord r) {
        return new BatterComparisonItem(PlayerDetailResponse.from(r.getPlayer()), TeamSummary.from(r.getTeam()),
                r.getSeason(), BatterStats.from(r));
    }
}
