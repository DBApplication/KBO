package com.dbapplication.kbo.domain.team.dto;

import com.dbapplication.kbo.domain.team.entity.Team;
import io.swagger.v3.oas.annotations.media.Schema;

/** 목록·기록·순위·경기 카드에 쓰는 팀 요약. code(KBO 팀 코드)·shortName(약칭)은 V2 에서 추가. */
public record TeamSummary(
        @Schema(description = "팀 ID", example = "1") Long id,
        @Schema(description = "KBO 팀 코드 (없으면 null)", example = "LG", nullable = true) String code,
        @Schema(description = "팀 이름", example = "LG") String name,
        @Schema(description = "팀 약칭 (없으면 null)", example = "LG", nullable = true) String shortName,
        @Schema(description = "팀 로고 URL (없으면 null)", nullable = true) String logoUrl) {

    public static TeamSummary from(Team team) {
        return team == null ? null
                : new TeamSummary(team.getId(), team.getCode(), team.getName(), team.getShortName(), team.getLogoUrl());
    }
}
