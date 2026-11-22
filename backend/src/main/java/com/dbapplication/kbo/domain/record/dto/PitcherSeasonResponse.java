package com.dbapplication.kbo.domain.record.dto;

import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

/** 선수 상세의 연도별 투구 기록 한 행. */
public record PitcherSeasonResponse(Integer season, TeamSummary team, PitcherStats stats) {

    public static PitcherSeasonResponse from(PitcherSeasonRecord r) {
        return new PitcherSeasonResponse(r.getSeason(), TeamSummary.from(r.getTeam()), PitcherStats.from(r));
    }
}
