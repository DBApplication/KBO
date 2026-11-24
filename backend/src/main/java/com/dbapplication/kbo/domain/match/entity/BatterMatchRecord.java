package com.dbapplication.kbo.domain.match.entity;

import com.dbapplication.kbo.domain.player.entity.Player;
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
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 경기별 타자 기록 (박스스코어 한 줄). 비율 기록은 저장하지 않고 응답 DTO 에서 계산한다. */
@Entity
@Table(name = "batter_match_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BatterMatchRecord {

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

    /** 박스스코어 표의 줄 순서 (팀별 1부터) */
    @Column(name = "seq", nullable = false)
    private Integer seq;

    /** KBO 선수 ID 로 확인된 경우만 있다. 동명이인 등으로 확인 못 하면 null */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private Player player;

    @Column(name = "player_name", nullable = false, length = 50)
    private String playerName;

    @Column(name = "batting_order")
    private Integer battingOrder;

    @Column(name = "position", length = 20)
    private String position;

    @Column(name = "pa", nullable = false)
    private Integer pa;

    @Column(name = "ab", nullable = false)
    private Integer ab;

    @Column(name = "hits", nullable = false)
    private Integer hits;

    @Column(name = "doubles", nullable = false)
    private Integer doubles;

    @Column(name = "triples", nullable = false)
    private Integer triples;

    @Column(name = "home_runs", nullable = false)
    private Integer homeRuns;

    @Column(name = "rbi", nullable = false)
    private Integer rbi;

    @Column(name = "runs", nullable = false)
    private Integer runs;

    @Column(name = "walks", nullable = false)
    private Integer walks;

    @Column(name = "hit_by_pitch", nullable = false)
    private Integer hitByPitch;

    @Column(name = "strikeouts", nullable = false)
    private Integer strikeouts;

    @Column(name = "sac_flies", nullable = false)
    private Integer sacFlies;
}
