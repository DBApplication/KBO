package com.dbapplication.kbo.domain.record.dto;

import com.dbapplication.kbo.domain.player.dto.PlayerDetailResponse;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

public record PitcherComparisonItem(PlayerDetailResponse player, TeamSummary team, Integer season,
                                    PitcherStats stats) {

    public static PitcherComparisonItem from(PitcherSeasonRecord r) {
        return new PitcherComparisonItem(PlayerDetailResponse.from(r.getPlayer()), TeamSummary.from(r.getTeam()),
                r.getSeason(), PitcherStats.from(r));
    }
}
