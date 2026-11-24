package com.dbapplication.kbo.domain.record.controller;

import com.dbapplication.kbo.domain.record.dto.StandingsResponse;
import com.dbapplication.kbo.domain.record.service.StandingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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

    @Operation(summary = "[팀 기록] 팀 순위표",
            description = "승·패·무, 승률, 게임차를 순위 순으로 준다. season 을 생략하면 기록이 있는 최신 시즌을 쓴다.")
    @GetMapping
    public StandingsResponse getStandings(
            @Parameter(description = "시즌 (연도). 미지정 시 최신 시즌", example = "2025")
            @RequestParam(required = false) Integer season) {
        return standingsService.getStandings(season);
    }

    @Operation(summary = "[팀 기록] 순위 기록이 있는 시즌 목록 (최신순)",
            description = "시즌 선택 드롭다운용. 선수 기록 시즌 목록(/api/records/seasons)과 다를 수 있다.")
    @GetMapping("/seasons")
    public List<Integer> getSeasons() {
        return standingsService.getSeasons();
    }
}
