package com.dbapplication.kbo.domain.record.controller;

import com.dbapplication.kbo.domain.record.dto.StandingsResponse;
import com.dbapplication.kbo.domain.record.service.StandingsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Standings")
@RestController
@RequestMapping("/api/standings")
@RequiredArgsConstructor
public class StandingsController {

    private final StandingsService standingsService;

    /** 팀 기록: GET /api/standings?season=2025 (season 생략 시 최신 시즌) */
    @GetMapping
    public StandingsResponse getStandings(@RequestParam(required = false) Integer season) {
        return standingsService.getStandings(season);
    }

    /** 시즌 선택 목록: GET /api/standings/seasons */
    @GetMapping("/seasons")
    public List<Integer> getSeasons() {
        return standingsService.getSeasons();
    }
}
