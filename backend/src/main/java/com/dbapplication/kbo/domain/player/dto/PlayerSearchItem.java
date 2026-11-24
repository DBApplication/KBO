package com.dbapplication.kbo.domain.player.dto;

import com.dbapplication.kbo.domain.player.entity.Player;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import io.swagger.v3.oas.annotations.media.Schema;

public record PlayerSearchItem(
        @Schema(description = "선수 ID", example = "1") Long id,
        @Schema(description = "이름", example = "오스틴") String name,
        @Schema(description = "타자/투수 구분") PlayerType type,
        @Schema(description = "포지션", example = "내야수") String position,
        @Schema(description = "선수 사진 URL (없으면 null)", nullable = true) String imageUrl,
        @Schema(description = "소속 팀 (없으면 null)", nullable = true) TeamSummary team) {

    public static PlayerSearchItem from(Player p) {
        return new PlayerSearchItem(p.getId(), p.getName(), PlayerType.of(p.getPosition()),
                p.getPosition(), p.getImageUrl(), TeamSummary.from(p.getTeam()));
    }
}
