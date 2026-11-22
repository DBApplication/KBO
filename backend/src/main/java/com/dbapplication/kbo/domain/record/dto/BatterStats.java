package com.dbapplication.kbo.domain.record.dto;

import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import java.math.BigDecimal;

/** 타자 시즌 기록 수치. 컬럼명 약어를 화면에서 쓰기 쉬운 이름으로 매핑한다. */
public record BatterStats(
        BigDecimal avg,
        Integer games,
        Integer pa,
        Integer ab,
        Integer runs,
        Integer hits,
        Integer doubles,
        Integer triples,
        Integer homeRuns,
        Integer totalBases,
        Integer rbi,
        Integer stolenBases,
        Integer caughtStealing,
        Integer walks,
        Integer hitByPitch,
        Integer strikeouts,
        Integer gdp,
        BigDecimal slg,
        BigDecimal obp,
        Integer errors,
        BigDecimal ops) {

    public static BatterStats from(BatterSeasonRecord r) {
        return new BatterStats(r.getBatAvg(), r.getBatGames(), r.getBatPa(), r.getBatAb(), r.getBatR(),
                r.getBatH(), r.getBat2b(), r.getBat3b(), r.getBatHr(), r.getBatTb(), r.getBatRbi(),
                r.getBatSb(), r.getBatCs(), r.getBatBb(), r.getBatHbp(), r.getBatSo(), r.getBatGdp(),
                r.getBatSlg(), r.getBatObp(), r.getBatE(), r.getBatOps());
    }
}
