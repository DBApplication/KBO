package com.dbapplication.kbo.domain.player.dto;

import com.dbapplication.kbo.domain.player.entity.Player;

public record PlayerSummary(Long id, String name, String position, String imageUrl) {

    public static PlayerSummary from(Player player) {
        return new PlayerSummary(player.getId(), player.getName(), player.getPosition(), player.getImageUrl());
    }
}
