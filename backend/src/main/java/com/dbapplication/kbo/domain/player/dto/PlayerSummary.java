package com.dbapplication.kbo.domain.player.dto;

import com.dbapplication.kbo.domain.player.entity.Player;
import io.swagger.v3.oas.annotations.media.Schema;

public record PlayerSummary(
        @Schema(description = "선수 ID", example = "1") Long id,
        @Schema(description = "이름", example = "오스틴") String name,
        @Schema(description = "포지션 (투수/포수/내야수/외야수 등)", example = "내야수") String position,
        @Schema(description = "선수 사진 URL (없으면 null)", nullable = true) String imageUrl) {

    public static PlayerSummary from(Player player) {
        return new PlayerSummary(player.getId(), player.getName(), player.getPosition(), player.getImageUrl());
    }
}
