package com.dbapplication.kbo.domain.collect.service;

import com.dbapplication.kbo.domain.collect.KboSyncProperties;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 매일 정해진 시각(기본 04:30, 한국 시간)에 DB 를 최신 경기 상태로 맞춘다.
 * 1) 최근 며칠(lookbackDays, 기본 2일) 경기: 결과·박스스코어 적재, 늦게 끝난 경기·취소 반영
 * 2) 앞으로 며칠(upcomingDays, 기본 7일) 일정: 예정 경기 추가 (화면의 예정 경기·예매 버튼용)
 * 3) live-enabled 면 경기 시간대에 몇 분마다 오늘 경기 점수·상태 갱신 (live())
 * app.kbo-sync.enabled=false 이면 이 빈이 만들어지지 않는다 (테스트, 수집을 원하지 않는 환경).
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.kbo-sync", name = "enabled", havingValue = "true", matchIfMissing = true)
public class KboSyncScheduler {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final KboSyncService service;
    private final KboSyncProperties props;

    public KboSyncScheduler(KboSyncService service, KboSyncProperties props) {
        this.service = service;
        this.props = props;
    }

    @Scheduled(cron = "${app.kbo-sync.cron:0 30 4 * * *}", zone = "Asia/Seoul")
    public void daily() {
        LocalDate today = LocalDate.now(SEOUL);
        List<LocalDate> dates = new ArrayList<>();
        for (int d = props.lookbackDays(); d >= 1; d--) dates.add(today.minusDays(d));
        for (int d = 0; d < props.upcomingDays(); d++) dates.add(today.plusDays(d));
        log.info("[KBO 수집] 예약 실행 시작: {} ~ {}", dates.get(0), dates.get(dates.size() - 1));
        try {
            service.sync(dates, "SCHEDULE");
        } catch (KboSyncService.SyncBusyException e) {
            log.warn("[KBO 수집] 다른 수집이 실행 중이라 이번 예약 실행은 건너뜁니다");
        }
    }

    /**
     * 경기 시간대 실시간 갱신 (기본 13~23시 5분마다, app.kbo-sync.live-enabled).
     * 오늘 경기 목록만 다시 받아 진행 중 점수·상태를 바꾸고, 새로 끝난 경기만 박스스코어를 넣는다.
     */
    @Scheduled(cron = "${app.kbo-sync.live-cron:0 */5 13-23 * * *}", zone = "Asia/Seoul")
    public void live() {
        if (!props.liveEnabled()) return;
        try {
            service.syncLive(LocalDate.now(SEOUL));
        } catch (KboSyncService.SyncBusyException e) {
            log.debug("[KBO 수집] 다른 수집이 실행 중이라 이번 실시간 갱신은 건너뜁니다");
        }
    }
}
