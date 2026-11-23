package com.dbapplication.kbo.domain.player.dto;

import com.dbapplication.kbo.domain.player.entity.Player;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;

public record PlayerSearchItem(Long id, String name, PlayerType type, String position, String imageUrl,
                               TeamSummary team) {

    public static PlayerSearchItem from(Player p) {
        return new PlayerSearchItem(p.getId(), p.getName(), PlayerType.of(p.getPosition()),
                p.getPosition(), p.getImageUrl(), TeamSummary.from(p.getTeam()));
    }
}
