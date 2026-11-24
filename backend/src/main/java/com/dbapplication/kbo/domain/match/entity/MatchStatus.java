package com.dbapplication.kbo.domain.match.entity;

import java.util.Arrays;
import java.util.Optional;

/** matches.status 에 들어가는 값 (V2 의 ck_matches_status 와 같은 목록). */
public enum MatchStatus {
    SCHEDULED,
    IN_PROGRESS,
    FINISHED,
    CANCELED;

    public static Optional<MatchStatus> parse(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        return Arrays.stream(values())
                .filter(s -> s.name().equalsIgnoreCase(value.trim()))
                .findFirst();
    }
}
