package com.dbapplication.kbo.domain.match.dto;

import com.dbapplication.kbo.domain.match.entity.MatchEvent;

public record MatchEventResponse(String type, Integer itemNo, String description) {

    public static MatchEventResponse from(MatchEvent e) {
        return new MatchEventResponse(e.getEventType(), e.getItemNo(), e.getDescription());
    }
}
