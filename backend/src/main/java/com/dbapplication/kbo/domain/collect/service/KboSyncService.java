package com.dbapplication.kbo.domain.collect.service;

import com.dbapplication.kbo.domain.collect.KboSyncProperties;
import com.dbapplication.kbo.domain.collect.clean.BoxScoreCleaner;
import com.dbapplication.kbo.domain.collect.clean.BoxScoreValidator;
import com.dbapplication.kbo.domain.collect.clean.CleanGame;
import com.dbapplication.kbo.domain.collect.load.BoxScoreWriter;
import com.dbapplication.kbo.domain.collect.load.StandingsWriter;
import com.dbapplication.kbo.domain.collect.load.SyncRunLog;
import com.dbapplication.kbo.domain.collect.source.BoxScore;
import com.dbapplication.kbo.domain.collect.source.KboGame;
import com.dbapplication.kbo.domain.collect.source.KboGameCenterClient;
import com.dbapplication.kbo.domain.collect.source.KboResponseParser;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.concurrent.locks.ReentrantLock;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * KBO 경기 데이터 수집 → 정제 → 검증 → 적재. 날짜 하나 단위로 실행한다.
 * - 경기 하나 = 트랜잭션 하나. 한 경기가 검증에 실패해도 다른 경기는 들어간다. 실패한 경기는 DB 를 건드리지 않는다.
 * - 종료 경기: 박스스코어까지 적재. 예정·진행·취소 경기: matches 한 줄만 추가·갱신.
 * - 적재한 경기가 있으면 그 시즌 팀 순위를 다시 계산한다.
 * - 실행마다 kbo_sync_run 에 결과를 남긴다.
 */
@Slf4j
@Service
public class KboSyncService {

    private final KboGameCenterClient client;
    private final KboResponseParser parser;
    private final BoxScoreCleaner cleaner;
    private final BoxScoreValidator validator;
    private final BoxScoreWriter writer;
    private final StandingsWriter standings;
    private final SyncRunLog runLog;
    private final TransactionTemplate tx;
    private final KboSyncProperties props;
    // 예약 실행과 수동 실행이 겹치지 않게 한 번에 하나만
    private final ReentrantLock lock = new ReentrantLock();

    public KboSyncService(KboGameCenterClient client, KboResponseParser parser, BoxScoreCleaner cleaner,
            BoxScoreValidator validator, BoxScoreWriter writer, StandingsWriter standings, SyncRunLog runLog,
            TransactionTemplate tx, KboSyncProperties props) {
        this.client = client;
        this.parser = parser;
        this.cleaner = cleaner;
        this.validator = validator;
        this.writer = writer;
        this.standings = standings;
        this.runLog = runLog;
        this.tx = tx;
        this.props = props;
    }

    /** 여러 날짜를 차례로 수집한다. 다른 수집이 돌고 있으면 SyncBusyException. */
    public List<SyncResult> sync(List<LocalDate> dates, String trigger) {
        return sync(dates, trigger, false);
    }

    /**
     * 경기 중 실시간 갱신: 그 날짜 경기 목록을 다시 받아 점수·상태만 바꾸고,
     * 새로 끝난 경기만 박스스코어를 받는다 (이미 저장한 종료 경기는 다시 받지 않는다).
     */
    public SyncResult syncLive(LocalDate date) {
        return sync(List.of(date), "SCHEDULE", true).get(0);
    }

    private List<SyncResult> sync(List<LocalDate> dates, String trigger, boolean live) {
        if (!lock.tryLock()) throw new SyncBusyException();
        try {
            List<SyncResult> results = new ArrayList<>();
            Set<Integer> seasons = new TreeSet<>();
            for (LocalDate date : dates) {
                SyncResult r = syncDate(date, trigger, live);
                results.add(r);
                // 실시간 갱신은 새로 끝난 경기가 있을 때만 순위를 다시 계산한다
                if (live ? r.loaded() > 0 : r.loaded() + r.updated() > 0) seasons.add(date.getYear());
            }
            for (int season : seasons) {
                LocalDate asOf = standings.refresh(season);
                if (asOf != null) log.info("[KBO 수집] {} 시즌 순위 다시 계산 (기준일 {})", season, asOf);
            }
            return results;
        } finally {
            lock.unlock();
        }
    }

    SyncResult syncDate(LocalDate date, String trigger, boolean live) {
        long runId = runLog.start(date, trigger);
        int loaded = 0, updated = 0;
        List<String> failures = new ArrayList<>();
        List<KboGame> games;
        try {
            games = parser.gameList(client.gameList(date));
        } catch (RuntimeException e) {
            String msg = "경기 목록을 받지 못했습니다: " + e.getMessage();
            runLog.finish(runId, "FAILED", 0, 0, 0, 0, msg);
            log.warn("[KBO 수집] {} {}", date, msg);
            return new SyncResult(runId, date, "FAILED", 0, 0, 0, 0, List.of(msg));
        }
        boolean first = true;
        for (KboGame game : games) {
            try {
                if (game.state() == KboGame.State.UNKNOWN) {
                    failures.add(game.kboGameId() + " 알 수 없는 경기 상태(GAME_STATE_SC=" + game.stateCode()
                            + ")라 건너뜀");
                    continue;
                }
                if (game.state() == KboGame.State.FINISHED && live && writer.hasFinishedBoxScore(game.kboGameId())) {
                    continue; // 실시간 갱신: 이미 저장한 종료 경기는 다시 받지 않는다
                }
                if (game.state() == KboGame.State.FINISHED) {
                    if (!first) pause();
                    first = false;
                    BoxScore box = parser.boxScore(game, client.scoreBoard(game), client.boxScore(game));
                    CleanGame clean = cleaner.clean(box);
                    List<String> errors = validator.validate(game, clean);
                    if (!errors.isEmpty()) {
                        failures.add(game.kboGameId() + " 검증 실패: " + String.join(", ", errors));
                        continue;
                    }
                    tx.executeWithoutResult(s -> writer.replaceBoxScore(writer.upsertMatch(game), game, clean));
                    loaded++;
                } else {
                    tx.executeWithoutResult(s -> writer.upsertMatch(game));
                    updated++;
                }
            } catch (RuntimeException e) {
                failures.add(game.kboGameId() + " " + e.getMessage());
            }
        }
        String status = games.isEmpty() ? "NO_GAMES"
                : failures.isEmpty() ? "SUCCESS" : (loaded + updated > 0 ? "PARTIAL" : "FAILED");
        runLog.finish(runId, status, games.size(), loaded, updated, failures.size(),
                failures.isEmpty() ? null : String.join("\n", failures));
        log.info("[KBO 수집] {} {}: 경기 {} / 적재 {} / 갱신 {} / 실패 {}", date, status, games.size(), loaded, updated,
                failures.size());
        failures.forEach(f -> log.warn("[KBO 수집] {}", f));
        return new SyncResult(runId, date, status, games.size(), loaded, updated, failures.size(), failures);
    }

    private void pause() {
        try {
            Thread.sleep(props.requestDelay().toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /** 날짜 하나 수집 결과 (kbo_sync_run 한 줄과 같다) */
    public record SyncResult(long runId, LocalDate date, String status, int gamesFound, int loaded, int updated,
            int failed, List<String> failures) {
    }

    /** 이미 다른 수집이 돌고 있을 때 */
    public static class SyncBusyException extends RuntimeException {
        public SyncBusyException() {
            super("이미 수집이 실행 중입니다.");
        }
    }
}
