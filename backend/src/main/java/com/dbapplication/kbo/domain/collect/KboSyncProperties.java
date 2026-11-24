package com.dbapplication.kbo.domain.collect;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * KBO 경기 데이터 자동 수집 설정 (application.yml 의 app.kbo-sync).
 *
 * @param enabled       매일 예약 실행 여부. 관리자 API 수동 실행은 이 값과 상관없이 동작한다.
 * @param cron          예약 실행 시각 (Asia/Seoul). 기본 매일 04:30 — 전날 경기가 모두 끝난 뒤.
 * @param lookbackDays  예약 실행 때 오늘 기준 며칠 전까지 다시 수집할지 (1 = 어제만).
 * @param upcomingDays  예약 실행 때 앞으로 며칠 치 일정(예정 경기)을 미리 넣을지. 0 이면 하지 않는다.
 * @param baseUrl       KBO 홈페이지 주소. 테스트에서는 가짜 서버 주소로 바꾼다.
 * @param requestDelay  KBO 서버 부담을 줄이려고 경기 사이에 쉬는 시간.
 * @param timeout       요청 하나의 제한 시간.
 * @param adminToken    관리자 API 의 X-Admin-Token 값. 비어 있으면 관리자 API 를 막는다.
 */
@ConfigurationProperties(prefix = "app.kbo-sync")
public record KboSyncProperties(
        boolean enabled,
        String cron,
        int lookbackDays,
        int upcomingDays,
        String baseUrl,
        Duration requestDelay,
        Duration timeout,
        String adminToken) {

    public KboSyncProperties {
        if (cron == null || cron.isBlank()) cron = "0 30 4 * * *";
        if (lookbackDays < 1) lookbackDays = 1;
        if (upcomingDays < 0) upcomingDays = 0;
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://www.koreabaseball.com";
        if (requestDelay == null) requestDelay = Duration.ofMillis(500);
        if (timeout == null) timeout = Duration.ofSeconds(15);
        if (adminToken == null) adminToken = "";
    }
}
