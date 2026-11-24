package com.dbapplication.kbo.domain.collect.source;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * KBO 일정 한 경기 (수집한 그대로의 값 + 상태 해석).
 *
 * @param gameId      KBO 게임센터 경기 ID (예: 20250601OBWO0). 박스스코어 요청에 쓴다.
 * @param seasonId    시즌 (박스스코어 요청 파라미터)
 * @param seriesId    정규시즌 0, 포스트시즌 등은 다른 값 (박스스코어 요청 파라미터)
 * @param state       경기 상태 (예정/진행 중/종료/취소, 해석하지 못한 값은 UNKNOWN)
 * @param awayScore   종료·진행 경기만 값이 있다
 * @param pitcherIds  경기 목록에만 있는 투수 KBO ID (선발·승·패·세이브 투수 이름 → ID)
 * @param stateCode   KBO 원본 상태 값 (GAME_STATE_SC). UNKNOWN 일 때 실패 기록에 남긴다.
 */
public record KboGame(
        String gameId,
        int seasonId,
        int seriesId,
        LocalDate date,
        LocalTime time,
        String awayCode,
        String homeCode,
        String stadium,
        State state,
        Integer awayScore,
        Integer homeScore,
        java.util.Map<String, Integer> pitcherIds,
        String stateCode) {

    /** UNKNOWN: 처음 보는 상태 값 (예: 서스펜디드). 그 경기만 건너뛰고 나머지 경기는 계속 수집한다. */
    public enum State { SCHEDULED, IN_PROGRESS, FINISHED, CANCELED, UNKNOWN }

    /** DB 의 matches.kbo_game_id 형식: 날짜_원정+홈+더블헤더 (예: 20250601_OBWO0) */
    public String kboGameId() {
        return gameId.substring(0, 8) + "_" + gameId.substring(8);
    }

    /** 경기 ID 마지막 글자: 0 일반, 1·2 더블헤더 1·2차전 */
    public int doubleheader() {
        return Character.digit(gameId.charAt(gameId.length() - 1), 10);
    }
}
