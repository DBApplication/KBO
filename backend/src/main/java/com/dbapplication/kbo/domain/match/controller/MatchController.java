package com.dbapplication.kbo.domain.match.controller;

import com.dbapplication.kbo.domain.match.dto.DailyPlayerRecordsResponse;
import com.dbapplication.kbo.domain.match.dto.MatchDetailResponse;
import com.dbapplication.kbo.domain.match.dto.MatchSummaryResponse;
import com.dbapplication.kbo.domain.match.service.MatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Match")
@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @Operation(summary = "[경기 기록] 날짜별 경기 목록",
            description = "그 날짜의 경기를 시작 시각 순서로 준다. 박스스코어를 수집하지 않은 경기도 포함된다.")
    @GetMapping
    public List<MatchSummaryResponse> getMatches(
            @Parameter(description = "조회할 경기 날짜 (yyyy-MM-dd)", example = "2025-06-01")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Parameter(description = "팀 ID 필터. 홈·원정 어느 쪽이든 그 팀의 경기를 준다 (미지정 시 전체 팀)")
            @RequestParam(required = false) Long teamId,
            @Parameter(description = "경기 상태 필터: SCHEDULED | IN_PROGRESS | FINISHED | CANCELED (대소문자 무시, 미지정 시 전체)",
                    example = "FINISHED")
            @RequestParam(required = false) String status) {
        return matchService.getMatches(date, teamId, status);
    }

    @Operation(summary = "[경기 기록] 달력: 경기가 있는 날짜 목록",
            description = "from~to 기간 안에서 경기가 하루라도 있는 날짜만 오름차순으로 준다. 달력에 점을 찍는 용도.")
    @GetMapping("/dates")
    public List<LocalDate> getMatchDates(
            @Parameter(description = "조회 시작일 (yyyy-MM-dd, 포함)", example = "2025-06-01")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "조회 종료일 (yyyy-MM-dd, 포함)", example = "2025-06-30")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @Parameter(description = "팀 ID 필터 (미지정 시 전체 팀)")
            @RequestParam(required = false) Long teamId) {
        return matchService.getMatchDates(from, to, teamId);
    }

    @Operation(summary = "[홈] 일별 선수 기록",
            description = "그 날 열린 모든 경기의 타자·투수 기록을 묶어서 준다. "
                    + "박스스코어를 수집하지 않은 날짜는 빈 목록이 된다.")
    @GetMapping("/player-records")
    public DailyPlayerRecordsResponse getDailyPlayerRecords(
            @Parameter(description = "조회할 경기 날짜 (yyyy-MM-dd)", example = "2025-06-01")
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return matchService.getDailyPlayerRecords(date);
    }

    @Operation(summary = "[경기 상세] 점수판·하이라이트·주요 기록·출전 선수",
            description = "박스스코어를 수집하지 않은 경기는 scoreboard 가 null 이다. "
                    + "없는 경기 ID 면 404 (M001).")
    @GetMapping("/{id}")
    public MatchDetailResponse getMatch(
            @Parameter(description = "경기 ID", example = "1") @PathVariable Long id) {
        return matchService.getMatch(id);
    }
}
