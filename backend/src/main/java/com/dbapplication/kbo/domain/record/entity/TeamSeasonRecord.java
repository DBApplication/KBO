package com.dbapplication.kbo.domain.record.entity;

import com.dbapplication.kbo.domain.team.entity.Team;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 팀 시즌 순위. 기준일(asOfDate)마다 한 행씩 저장한다. */
@Entity
@Table(name = "team_season_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TeamSeasonRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "season", nullable = false)
    private Integer season;

    /** 순위 기준일 */
    @Column(name = "as_of_date", nullable = false)
    private LocalDate asOfDate;

    @Column(name = "team_rank", nullable = false)
    private Integer teamRank;

    @Column(name = "games", nullable = false)
    private Integer games;

    @Column(name = "wins", nullable = false)
    private Integer wins;

    @Column(name = "losses", nullable = false)
    private Integer losses;

    @Column(name = "draws", nullable = false)
    private Integer draws;

    /** 승률 = 승 ÷ (승 + 패) */
    @Column(name = "win_pct", precision = 4, scale = 3)
    private BigDecimal winPct;

    /** 게임 차 */
    @Column(name = "games_behind", precision = 4, scale = 1)
    private BigDecimal gamesBehind;

    /** 최근 10경기 (예: 4승0무6패) */
    @Column(name = "last10", length = 20)
    private String last10;

    /** 연속 기록 (예: 3패) */
    @Column(name = "streak", length = 10)
    private String streak;

    @Builder
    private TeamSeasonRecord(Team team, Integer season, LocalDate asOfDate, Integer teamRank,
            Integer games, Integer wins, Integer losses, Integer draws, BigDecimal winPct,
            BigDecimal gamesBehind, String last10, String streak) {
        this.team = team;
        this.season = season;
        this.asOfDate = asOfDate;
        this.teamRank = teamRank;
        this.games = games;
        this.wins = wins;
        this.losses = losses;
        this.draws = draws;
        this.winPct = winPct;
        this.gamesBehind = gamesBehind;
        this.last10 = last10;
        this.streak = streak;
    }
}
