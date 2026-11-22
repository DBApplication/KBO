package com.dbapplication.kbo.domain.match.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 이닝별 득점. 실제로 공격한 이닝만 행이 있다. */
@Entity
@Table(name = "match_inning_score")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchInningScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Enumerated(EnumType.STRING)
    @Column(name = "home_away", nullable = false, length = 4)
    private HomeAway homeAway;

    @Column(name = "inning", nullable = false)
    private Integer inning;

    @Column(name = "runs", nullable = false)
    private Integer runs;

    @Builder
    private MatchInningScore(Match match, HomeAway homeAway, Integer inning, Integer runs) {
        this.match = match;
        this.homeAway = homeAway;
        this.inning = inning;
        this.runs = runs;
    }
}
