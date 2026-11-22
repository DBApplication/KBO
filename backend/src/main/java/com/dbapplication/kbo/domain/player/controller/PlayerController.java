package com.dbapplication.kbo.domain.player.controller;

import com.dbapplication.kbo.domain.player.dto.PlayerDetailResponse;
import com.dbapplication.kbo.domain.player.dto.PlayerSearchItem;
import com.dbapplication.kbo.domain.player.dto.PlayerType;
import com.dbapplication.kbo.domain.player.service.PlayerService;
import com.dbapplication.kbo.global.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Player")
@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @Operation(summary = "선수 검색 (헤더 검색, 선수 비교 선택용)")
    @GetMapping
    public PageResponse<PlayerSearchItem> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long teamId,
            @RequestParam(required = false) PlayerType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return playerService.search(keyword, teamId, type, page, size);
    }

    @Operation(summary = "선수 상세 프로필")
    @GetMapping("/{id}")
    public PlayerDetailResponse detail(@PathVariable Long id) {
        return playerService.getDetail(id);
    }
}
