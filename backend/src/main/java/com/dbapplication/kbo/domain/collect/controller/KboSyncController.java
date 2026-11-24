package com.dbapplication.kbo.domain.collect.controller;

import com.dbapplication.kbo.domain.collect.KboSyncProperties;
import com.dbapplication.kbo.domain.collect.load.SyncRunLog;
import com.dbapplication.kbo.domain.collect.service.KboSyncService;
import com.dbapplication.kbo.global.error.BusinessException;
import com.dbapplication.kbo.global.error.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자용 수집 API. 예약 실행을 기다리지 않고 원하는 날짜를 바로 수집한다 (시연·누락 날짜 보충).
 * X-Admin-Token 헤더가 app.kbo-sync.admin-token 과 같아야 한다. 토큰이 설정돼 있지 않으면 항상 거부한다.
 */
@Tag(name = "관리자 · KBO 데이터 수집")
@RestController
@RequestMapping("/api/admin/kbo-sync")
public class KboSyncController {

    private static final int MAX_DAYS = 31;

    private final KboSyncService service;
    private final SyncRunLog runLog;
    private final KboSyncProperties props;

    public KboSyncController(KboSyncService service, SyncRunLog runLog, KboSyncProperties props) {
        this.service = service;
        this.props = props;
        this.runLog = runLog;
    }

    @Operation(summary = "날짜 지정 수집", description = "date 하루, 또는 from~to (최대 31일)를 KBO 에서 받아 DB 에 반영한다.")
    @PostMapping
    public ResponseEntity<List<KboSyncService.SyncResult>> sync(
            @RequestHeader(value = "X-Admin-Token", required = false) String token,
            @Parameter(description = "수집할 날짜", example = "2025-06-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Parameter(description = "기간 시작") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "기간 끝") @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        checkToken(token);
        List<LocalDate> dates = dates(date, from, to);
        try {
            return ResponseEntity.ok(service.sync(dates, "MANUAL"));
        } catch (KboSyncService.SyncBusyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @Operation(summary = "최근 수집 기록", description = "kbo_sync_run 최근 기록 (예약·수동 실행 모두)")
    @GetMapping("/runs")
    public List<SyncRunLog.Run> runs(@RequestHeader(value = "X-Admin-Token", required = false) String token,
            @RequestParam(defaultValue = "20") int limit) {
        checkToken(token);
        return runLog.recent(Math.min(Math.max(limit, 1), 200));
    }

    private void checkToken(String token) {
        String expected = props.adminToken();
        if (expected.isBlank()) throw new BusinessException(ErrorCode.FORBIDDEN);
        if (token == null || !MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                token.getBytes(StandardCharsets.UTF_8))) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }

    private static List<LocalDate> dates(LocalDate date, LocalDate from, LocalDate to) {
        if (date != null && from == null && to == null) return List.of(date);
        if (date == null && from != null && to != null && !to.isBefore(from)
                && ChronoUnit.DAYS.between(from, to) < MAX_DAYS) {
            return Stream.iterate(from, d -> !d.isAfter(to), d -> d.plusDays(1)).toList();
        }
        throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
    }
}
