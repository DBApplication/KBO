package com.dbapplication.kbo.domain.match.dto;

import com.dbapplication.kbo.domain.match.entity.PitcherMatchRecord;
import com.dbapplication.kbo.domain.player.dto.PlayerSummary;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 경기 하나의 투수 기록.
 *
 * @param decision W 승 / L 패 / S 세이브 / H 홀드 / null 기록 없음
 * @param innings  outs 로 만든 표기용 이닝 (예: "6 1/3")
 * @param era      이 경기 ERA = 자책 × 27 ÷ 아웃 수. 아웃 0 이면 null
 */
public record PitcherGameRecordResponse(
        Long matchId,
        TeamSummary team,
        String homeAway,
        Integer seq,
        PlayerSummary player,
        String playerName,
        Boolean starter,
        String decision,
        Integer outs,
        String innings,
        Integer battersFaced,
        Integer pitches,
        Integer hitsAllowed,
        Integer homeRunsAllowed,
        Integer bbHbp,
        Integer strikeouts,
        Integer runsAllowed,
        Integer earnedRuns,
        BigDecimal era) {

    public static PitcherGameRecordResponse from(PitcherMatchRecord r) {
        BigDecimal era = r.getOuts() == 0 ? null
                : BigDecimal.valueOf(r.getEarnedRuns() * 27L)
                        .divide(BigDecimal.valueOf(r.getOuts()), 2, RoundingMode.HALF_UP);
        return new PitcherGameRecordResponse(r.getMatch().getId(), TeamSummary.from(r.getTeam()),
                r.getHomeAway().name(), r.getSeq(),
                r.getPlayer() == null ? null : PlayerSummary.from(r.getPlayer()), r.getPlayerName(),
                r.getStarter(), r.getDecision(), r.getOuts(), innings(r.getOuts()), r.getBattersFaced(),
                r.getPitches(), r.getHitsAllowed(), r.getHomeRunsAllowed(), r.getBbHbp(), r.getStrikeouts(),
                r.getRunsAllowed(), r.getEarnedRuns(), era);
    }

    private static String innings(int outs) {
        int whole = outs / 3;
        return switch (outs % 3) {
            case 1 -> whole + " 1/3";
            case 2 -> whole + " 2/3";
            default -> String.valueOf(whole);
        };
    }
}
