package com.dbapplication.kbo.domain.player.dto;

import com.dbapplication.kbo.domain.player.entity.Player;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;

public record PlayerDetailResponse(
        @Schema(description = "선수 ID", example = "1") Long id,
        @Schema(description = "이름", example = "오스틴") String name,
        @Schema(description = "타자/투수 구분 (상세 화면 탭 결정용)") PlayerType type,
        @Schema(description = "포지션", example = "내야수") String position,
        @Schema(description = "투타 (예: 우투우타)", example = "우투우타") String throwBat,
        @Schema(description = "생년월일", example = "1993-10-14") LocalDate birthDate,
        @Schema(description = "키(cm)", example = "183") Integer height,
        @Schema(description = "몸무게(kg)", example = "97") Integer weight,
        @Schema(description = "선수 사진 URL (없으면 null)", nullable = true) String imageUrl,
        @Schema(description = "소속 팀 (없으면 null)", nullable = true) TeamSummary team) {

    public static PlayerDetailResponse from(Player p) {
        return new PlayerDetailResponse(p.getId(), p.getName(), PlayerType.of(p.getPosition()),
                p.getPosition(), p.getThrowBat(), p.getBirthDate(), p.getHeight(), p.getWeight(),
                p.getImageUrl(), TeamSummary.from(p.getTeam()));
    }
}
