package com.dbapplication.kbo.domain.team.dto;

import com.dbapplication.kbo.domain.team.entity.Team;
import io.swagger.v3.oas.annotations.media.Schema;

public record TeamSummary(
        @Schema(description = "팀 ID", example = "1") Long id,
        @Schema(description = "팀 이름", example = "LG") String name,
        @Schema(description = "팀 로고 URL (없으면 null)", nullable = true) String logoUrl) {

    public static TeamSummary from(Team team) {
        return team == null ? null : new TeamSummary(team.getId(), team.getName(), team.getLogoUrl());
    }
}
