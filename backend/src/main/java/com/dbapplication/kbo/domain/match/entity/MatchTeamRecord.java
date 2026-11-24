package com.dbapplication.kbo.domain.match.entity;

import com.dbapplication.kbo.domain.team.entity.Team;
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

/** 경기별 팀 합계 기록(R/H/E). 박스스코어를 수집한 경기에만 있다. */
@Entity
@Table(name = "match_team_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchTeamRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Enumerated(EnumType.STRING)
    @Column(name = "home_away", nullable = false, length = 4)
    private HomeAway homeAway;

    /** 득점 */
    @Column(name = "runs", nullable = false)
    private Integer runs;

    /** 안타 */
    @Column(name = "hits", nullable = false)
    private Integer hits;

    /** 실책 */
    @Column(name = "errors", nullable = false)
    private Integer errors;

    /** 4사구 */
    @Column(name = "bb_hbp")
    private Integer bbHbp;

    @Builder
    private MatchTeamRecord(Match match, Team team, HomeAway homeAway, Integer runs,
            Integer hits, Integer errors, Integer bbHbp) {
        this.match = match;
        this.team = team;
        this.homeAway = homeAway;
        this.runs = runs;
        this.hits = hits;
        this.errors = errors;
        this.bbHbp = bbHbp;
    }
}
