package com.dbapplication.kbo.domain.player.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** 화면의 타자/투수 탭 구분. position 이 "투수" 이면 PITCHER, 그 외(null 포함)는 BATTER. */
@Schema(description = "타자/투수 구분. position 이 '투수'면 PITCHER, 그 외는 BATTER")
public enum PlayerType {
    BATTER, PITCHER;

    public static final String PITCHER_POSITION = "투수";

    public static PlayerType of(String position) {
        return PITCHER_POSITION.equals(position) ? PITCHER : BATTER;
    }
}
