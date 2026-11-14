package com.dbapplication.kbo.domain.match.entity;

import com.dbapplication.kbo.domain.team.entity.Team;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "matches")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "season")
    private Integer season;

    @Column(name = "match_date")
    private LocalDate matchDate;

    @Column(name = "match_time")
    private LocalTime matchTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_team_id")
    private Team homeTeam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "away_team_id")
    private Team awayTeam;

    @Column(name = "home_score")
    private Integer homeScore;

    @Column(name = "away_score")
    private Integer awayScore;

    @Column(name = "stadium", length = 100)
    private String stadium;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "ticket_url", length = 500)
    private String ticketUrl;

    /** 같은 팀 간 연전에서 몇 차전인지. */
    @Column(name = "sequence")
    private Integer sequence;

    @OneToMany(mappedBy = "match")
    private List<MatchHighlight> highlights = new ArrayList<>();

    @Builder
    private Match(Integer season, LocalDate matchDate, LocalTime matchTime, Team homeTeam,
            Team awayTeam, Integer homeScore, Integer awayScore, String stadium, String status,
            String ticketUrl, Integer sequence) {
        this.season = season;
        this.matchDate = matchDate;
        this.matchTime = matchTime;
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.homeScore = homeScore;
        this.awayScore = awayScore;
        this.stadium = stadium;
        this.status = status;
        this.ticketUrl = ticketUrl;
        this.sequence = sequence;
    }
}
