package com.dbapplication.kbo.domain.match.dto;

import com.dbapplication.kbo.domain.match.entity.Match;
import com.dbapplication.kbo.domain.match.entity.MatchStatus;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * 경기 기록 목록의 한 줄 (시각 · 구장 · 원정 · 점수 · 홈 · 상태 · 버튼).
 *
 * @param result HOME_WIN / AWAY_WIN / DRAW. 종료 경기가 아니면 null
 */
public record MatchSummaryResponse(
        Long id,
        String kboGameId,
        Integer season,
        LocalDate matchDate,
        LocalTime matchTime,
        String stadium,
        String status,
        Integer doubleheader,
        Integer sequence,
        TeamSummary awayTeam,
        TeamSummary homeTeam,
        Integer awayScore,
        Integer homeScore,
        String result,
        int highlightCount,
        MatchActions actions
) {

    public static MatchSummaryResponse of(Match match, List<String> highlightUrls) {
        return of(match, highlightUrls, match.getTicketUrl());
    }

    /** @param ticketUrl 예매하기 주소. 경기별 주소가 없으면 홈팀 구단 예매 페이지 (예정 경기에만 쓰인다) */
    public static MatchSummaryResponse of(Match match, List<String> highlightUrls, String ticketUrl) {
        MatchStatus status = MatchStatus.parse(match.getStatus()).orElse(null);
        return new MatchSummaryResponse(
                match.getId(),
                match.getKboGameId(),
                match.getSeason(),
                match.getMatchDate(),
                match.getMatchTime(),
                match.getStadium(),
                match.getStatus(),
                match.getDoubleheader(),
                match.getSequence(),
                TeamSummary.from(match.getAwayTeam()),
                TeamSummary.from(match.getHomeTeam()),
                match.getAwayScore(),
                match.getHomeScore(),
                result(status, match.getHomeScore(), match.getAwayScore()),
                highlightUrls.size(),
                MatchActions.of(status, ticketUrl, highlightUrls));
    }

    private static String result(MatchStatus status, Integer home, Integer away) {
        if (status != MatchStatus.FINISHED || home == null || away == null) {
            return null;
        }
        return home > away ? "HOME_WIN" : home < away ? "AWAY_WIN" : "DRAW";
    }
}
