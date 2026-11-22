package com.dbapplication.kbo.domain.record.dto;

import com.dbapplication.kbo.domain.player.dto.PlayerSummary;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

public record PitcherRankingItem(int rank, PlayerSummary player, TeamSummary team, PitcherStats stats) {

    public static PitcherRankingItem of(int rank, PitcherSeasonRecord r) {
        return new PitcherRankingItem(rank, PlayerSummary.from(r.getPlayer()), TeamSummary.from(r.getTeam()),
                PitcherStats.from(r));
    }
}
