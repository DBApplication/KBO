package com.dbapplication.kbo.domain.player.dto;

/** 화면의 타자/투수 탭 구분. */
public enum PlayerType {
    BATTER, PITCHER;

    public static final String PITCHER_POSITION = "투수";

    public static PlayerType of(String position) {
        return PITCHER_POSITION.equals(position) ? PITCHER : BATTER;
    }
}
