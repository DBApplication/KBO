package com.dbapplication.kbo.domain.match.dto;

import com.dbapplication.kbo.domain.match.entity.MatchHighlight;

public record HighlightResponse(Long id, String title, String url) {

    public static HighlightResponse from(MatchHighlight highlight) {
        return new HighlightResponse(highlight.getId(), highlight.getTitle(), highlight.getUrl());
    }
}
