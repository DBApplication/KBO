package com.dbapplication.kbo.domain.record.dto;

import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import java.math.BigDecimal;

/** 투수 시즌 기록 수치. innings 는 outs 로부터 만든 표기용 문자열(예: "181 1/3"). */
public record PitcherStats(
        BigDecimal era,
        Integer games,
        Integer completeGames,
        Integer shutouts,
        Integer wins,
        Integer losses,
        Integer saves,
        Integer holds,
        BigDecimal winPct,
        Integer battersFaced,
        Integer outs,
        String innings,
        Integer hits,
        Integer homeRuns,
        Integer walks,
        Integer hitByPitch,
        Integer strikeouts,
        Integer runs,
        Integer earnedRuns) {

    public static PitcherStats from(PitcherSeasonRecord r) {
        return new PitcherStats(r.getPitEra(), r.getPitGames(), r.getPitCg(), r.getPitSho(), r.getPitW(),
                r.getPitL(), r.getPitSv(), r.getPitHld(), r.getPitWpct(), r.getPitTbf(), r.getPitOuts(),
                formatInnings(r.getPitOuts()), r.getPitH(), r.getPitHr(), r.getPitBb(), r.getPitHbp(),
                r.getPitSo(), r.getPitR(), r.getPitEr());
    }

    static String formatInnings(Integer outs) {
        if (outs == null) {
            return null;
        }
        int whole = outs / 3;
        return switch (outs % 3) {
            case 1 -> whole + " 1/3";
            case 2 -> whole + " 2/3";
            default -> String.valueOf(whole);
        };
    }
}
