package com.dbapplication.kbo.domain.match.dto;

import com.dbapplication.kbo.domain.match.entity.BatterMatchRecord;
import com.dbapplication.kbo.domain.player.dto.PlayerSummary;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 경기 하나의 타자 기록.
 *
 * @param player     KBO 선수 ID 로 확인된 선수. 확인 못 한 기록(동명이인 등)은 null 이고 playerName 만 있다
 * @param totalBases 루타 = 안타 + 2루타 + 2×3루타 + 3×홈런
 * @param avg        이 경기 타율. 타수 0 이면 null
 * @param obp        출루율 = (안타+볼넷+사구) ÷ (타수+볼넷+사구+희생플라이). 분모 0 이면 null
 * @param slg        장타율 = 루타 ÷ 타수. 타수 0 이면 null
 * @param ops        출루율 + 장타율. 둘 중 하나라도 없으면 null
 */
public record BatterGameRecordResponse(
        Long matchId,
        TeamSummary team,
        String homeAway,
        Integer seq,
        PlayerSummary player,
        String playerName,
        Integer battingOrder,
        String position,
        Integer pa,
        Integer ab,
        Integer hits,
        Integer doubles,
        Integer triples,
        Integer homeRuns,
        Integer totalBases,
        Integer rbi,
        Integer runs,
        Integer walks,
        Integer hitByPitch,
        Integer strikeouts,
        Integer sacFlies,
        BigDecimal avg,
        BigDecimal obp,
        BigDecimal slg,
        BigDecimal ops) {

    public static BatterGameRecordResponse from(BatterMatchRecord r) {
        int tb = r.getHits() + r.getDoubles() + 2 * r.getTriples() + 3 * r.getHomeRuns();
        BigDecimal avg = ratio(r.getHits(), r.getAb());
        BigDecimal obp = ratio(r.getHits() + r.getWalks() + r.getHitByPitch(),
                r.getAb() + r.getWalks() + r.getHitByPitch() + r.getSacFlies());
        BigDecimal slg = ratio(tb, r.getAb());
        BigDecimal ops = obp == null || slg == null ? null : obp.add(slg);
        return new BatterGameRecordResponse(r.getMatch().getId(), TeamSummary.from(r.getTeam()),
                r.getHomeAway().name(), r.getSeq(),
                r.getPlayer() == null ? null : PlayerSummary.from(r.getPlayer()), r.getPlayerName(),
                r.getBattingOrder(), r.getPosition(), r.getPa(), r.getAb(), r.getHits(), r.getDoubles(),
                r.getTriples(), r.getHomeRuns(), tb, r.getRbi(), r.getRuns(), r.getWalks(),
                r.getHitByPitch(), r.getStrikeouts(), r.getSacFlies(), avg, obp, slg, ops);
    }

    private static BigDecimal ratio(int numerator, int denominator) {
        return denominator == 0 ? null
                : BigDecimal.valueOf(numerator).divide(BigDecimal.valueOf(denominator), 3, RoundingMode.HALF_UP);
    }
}
