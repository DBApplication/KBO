package com.dbapplication.kbo.domain.team.dto;

import com.dbapplication.kbo.domain.team.entity.Team;

public record TeamSummary(Long id, String name, String logoUrl) {

    public static TeamSummary from(Team team) {
        return team == null ? null : new TeamSummary(team.getId(), team.getName(), team.getLogoUrl());
    }
}
