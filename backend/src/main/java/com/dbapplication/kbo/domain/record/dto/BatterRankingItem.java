package com.dbapplication.kbo.domain.record.dto;

import com.dbapplication.kbo.domain.player.dto.PlayerSummary;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

public record BatterRankingItem(int rank, PlayerSummary player, TeamSummary team, BatterStats stats) {

    public static BatterRankingItem of(int rank, BatterSeasonRecord r) {
        return new BatterRankingItem(rank, PlayerSummary.from(r.getPlayer()), TeamSummary.from(r.getTeam()),
                BatterStats.from(r));
    }
}
