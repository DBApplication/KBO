package com.dbapplication.kbo.domain.match.controller;

import com.dbapplication.kbo.domain.match.dto.MatchDetailResponse;
import com.dbapplication.kbo.domain.match.dto.MatchSummaryResponse;
import com.dbapplication.kbo.domain.match.service.MatchService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    /** 경기 기록: GET /api/matches?date=2025-06-01&teamId=1&status=FINISHED */
    @GetMapping
    public List<MatchSummaryResponse> getMatches(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) String status) {
        return matchService.getMatches(date, teamId, status);
    }

    /** 달력: GET /api/matches/dates?from=2025-06-01&to=2025-06-30&teamId=1 */
    @GetMapping("/dates")
    public List<LocalDate> getMatchDates(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long teamId) {
        return matchService.getMatchDates(from, to, teamId);
    }

    /** 경기 상세: GET /api/matches/{id} */
    @GetMapping("/{id}")
    public MatchDetailResponse getMatch(@PathVariable Long id) {
        return matchService.getMatch(id);
    }
}
