package com.dbapplication.kbo.domain.team.dto;

import com.dbapplication.kbo.domain.team.entity.Team;

/** 목록·기록·순위·경기 카드에 쓰는 팀 요약. code(KBO 팀 코드)·shortName(약칭)은 V2 에서 추가. */
public record TeamSummary(Long id, String code, String name, String shortName, String logoUrl) {

    public static TeamSummary from(Team team) {
        return team == null ? null
                : new TeamSummary(team.getId(), team.getCode(), team.getName(), team.getShortName(), team.getLogoUrl());
    }
}
