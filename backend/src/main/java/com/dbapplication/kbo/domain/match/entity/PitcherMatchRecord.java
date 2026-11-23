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

/** 경기별 투수 기록 (등판 한 번). 경기 ERA 는 저장하지 않고 응답 DTO 에서 계산한다. */
@Entity
@Table(name = "pitcher_match_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PitcherMatchRecord {

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

    /** 등판 순서 (팀별 1부터) */
    @Column(name = "seq", nullable = false)
    private Integer seq;

    /** KBO 선수 ID 로 확인된 경우만 있다 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id")
    private Player player;

    @Column(name = "player_name", nullable = false, length = 50)
    private String playerName;

    @Column(name = "is_starter", nullable = false)
    private Boolean starter;

    /** W 승 / L 패 / S 세이브 / H 홀드 / null 기록 없음 */
    @Column(name = "decision", length = 2)
    private String decision;

    /** 잡은 아웃 수 */
    @Column(name = "outs", nullable = false)
    private Integer outs;

    @Column(name = "batters_faced", nullable = false)
    private Integer battersFaced;

    @Column(name = "pitches")
    private Integer pitches;

    @Column(name = "hits_allowed", nullable = false)
    private Integer hitsAllowed;

    @Column(name = "home_runs_allowed", nullable = false)
    private Integer homeRunsAllowed;

    @Column(name = "bb_hbp", nullable = false)
    private Integer bbHbp;

    @Column(name = "strikeouts", nullable = false)
    private Integer strikeouts;

    @Column(name = "runs_allowed", nullable = false)
    private Integer runsAllowed;

    @Column(name = "earned_runs", nullable = false)
    private Integer earnedRuns;
}
