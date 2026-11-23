package com.dbapplication.kbo.domain.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import java.math.BigDecimal;

/** 투수 시즌 기록 수치. innings 는 outs 로부터 만든 표기용 문자열(예: "181 1/3"). */
public record PitcherStats(
        @Schema(description = "평균자책점", example = "2.85") BigDecimal era,
        @Schema(description = "경기 수", example = "28") Integer games,
        @Schema(description = "완투", example = "1") Integer completeGames,
        @Schema(description = "완봉", example = "0") Integer shutouts,
        @Schema(description = "승", example = "12") Integer wins,
        @Schema(description = "패", example = "8") Integer losses,
        @Schema(description = "세이브", example = "0") Integer saves,
        @Schema(description = "홀드", example = "0") Integer holds,
        @Schema(description = "승률", example = "0.600") BigDecimal winPct,
        @Schema(description = "상대한 타자 수", example = "654") Integer battersFaced,
        @Schema(description = "투구 아웃 수 (이닝×3)", example = "544") Integer outs,
        @Schema(description = "이닝 표기용 문자열 (정렬 키 innings 는 outs 기준)", example = "181 1/3") String innings,
        @Schema(description = "피안타", example = "145") Integer hits,
        @Schema(description = "피홈런", example = "14") Integer homeRuns,
        @Schema(description = "볼넷", example = "44") Integer walks,
        @Schema(description = "사구", example = "6") Integer hitByPitch,
        @Schema(description = "탈삼진", example = "150") Integer strikeouts,
        @Schema(description = "실점", example = "56") Integer runs,
        @Schema(description = "자책점", example = "50") Integer earnedRuns) {

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
