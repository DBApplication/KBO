package com.dbapplication.kbo.domain.record.dto;

import com.dbapplication.kbo.domain.record.entity.TeamSeasonRecord;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** 팀 기록(순위표) 화면. 화면 위에 "기준일 2025.10.31" 로 asOfDate 를 보여 준다. */
public record StandingsResponse(Integer season, LocalDate asOfDate, List<Row> standings) {

    /** 승률이 같으면 KBO 공식 순위(teamRank)를 그대로 따른다. */
    public record Row(
            Integer rank,
            TeamSummary team,
            Integer games,
            Integer wins,
            Integer losses,
            Integer draws,
            BigDecimal winPct,
            BigDecimal gamesBehind,
            String last10,
            String streak
    ) {

        public static Row from(TeamSeasonRecord r) {
            return new Row(r.getTeamRank(), TeamSummary.from(r.getTeam()), r.getGames(),
                    r.getWins(), r.getLosses(), r.getDraws(), r.getWinPct(), r.getGamesBehind(),
                    r.getLast10(), r.getStreak());
        }
    }
}
