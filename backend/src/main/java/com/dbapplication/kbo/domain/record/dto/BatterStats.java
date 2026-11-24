package com.dbapplication.kbo.domain.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import java.math.BigDecimal;

/** 타자 시즌 기록 수치. 컬럼명 약어를 화면에서 쓰기 쉬운 이름으로 매핑한다. */
public record BatterStats(
        @Schema(description = "타율", example = "0.343") BigDecimal avg,
        @Schema(description = "경기 수", example = "120") Integer games,
        @Schema(description = "타석", example = "520") Integer pa,
        @Schema(description = "타수", example = "450") Integer ab,
        @Schema(description = "득점", example = "90") Integer runs,
        @Schema(description = "안타", example = "150") Integer hits,
        @Schema(description = "2루타", example = "30") Integer doubles,
        @Schema(description = "3루타", example = "2") Integer triples,
        @Schema(description = "홈런", example = "28") Integer homeRuns,
        @Schema(description = "루타", example = "262") Integer totalBases,
        @Schema(description = "타점", example = "104") Integer rbi,
        @Schema(description = "도루", example = "12") Integer stolenBases,
        @Schema(description = "도루 실패", example = "3") Integer caughtStealing,
        @Schema(description = "볼넷", example = "50") Integer walks,
        @Schema(description = "사구", example = "5") Integer hitByPitch,
        @Schema(description = "삼진", example = "102") Integer strikeouts,
        @Schema(description = "병살타", example = "10") Integer gdp,
        @Schema(description = "장타율", example = "0.595") BigDecimal slg,
        @Schema(description = "출루율", example = "0.407") BigDecimal obp,
        @Schema(description = "실책", example = "4") Integer errors,
        @Schema(description = "OPS (출루율+장타율)", example = "1.002") BigDecimal ops) {

    public static BatterStats from(BatterSeasonRecord r) {
        return new BatterStats(r.getBatAvg(), r.getBatGames(), r.getBatPa(), r.getBatAb(), r.getBatR(),
                r.getBatH(), r.getBat2b(), r.getBat3b(), r.getBatHr(), r.getBatTb(), r.getBatRbi(),
                r.getBatSb(), r.getBatCs(), r.getBatBb(), r.getBatHbp(), r.getBatSo(), r.getBatGdp(),
                r.getBatSlg(), r.getBatObp(), r.getBatE(), r.getBatOps());
    }
}
