package com.dbapplication.kbo.domain.team.controller;

import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import com.dbapplication.kbo.domain.team.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Team")
@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @Operation(summary = "팀 목록 (필터 드롭다운용)")
    @GetMapping
    public List<TeamSummary> list() {
        return teamService.findAll();
    }
}
