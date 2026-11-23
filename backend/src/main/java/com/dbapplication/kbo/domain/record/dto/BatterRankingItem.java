package com.dbapplication.kbo.domain.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import com.dbapplication.kbo.domain.player.dto.PlayerSummary;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

public record BatterRankingItem(
        @Schema(description = "순위 (정렬 결과 기준, 페이지 오프셋 반영)") int rank,
        @Schema(description = "선수") PlayerSummary player,
        @Schema(description = "해당 시즌 소속 팀") TeamSummary team,
        @Schema(description = "시즌 타격 기록") BatterStats stats) {

    public static BatterRankingItem of(int rank, BatterSeasonRecord r) {
        return new BatterRankingItem(rank, PlayerSummary.from(r.getPlayer()), TeamSummary.from(r.getTeam()),
                BatterStats.from(r));
    }
}
