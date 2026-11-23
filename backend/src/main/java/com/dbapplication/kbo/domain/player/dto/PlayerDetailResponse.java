package com.dbapplication.kbo.domain.player.dto;

import com.dbapplication.kbo.domain.player.entity.Player;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import java.time.LocalDate;

public record PlayerDetailResponse(
        Long id,
        String name,
        PlayerType type,
        String position,
        String throwBat,
        LocalDate birthDate,
        Integer height,
        Integer weight,
        String imageUrl,
        TeamSummary team) {

    public static PlayerDetailResponse from(Player p) {
        return new PlayerDetailResponse(p.getId(), p.getName(), PlayerType.of(p.getPosition()),
                p.getPosition(), p.getThrowBat(), p.getBirthDate(), p.getHeight(), p.getWeight(),
                p.getImageUrl(), TeamSummary.from(p.getTeam()));
    }
}
