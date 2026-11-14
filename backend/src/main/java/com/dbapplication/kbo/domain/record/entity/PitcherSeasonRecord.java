package com.dbapplication.kbo.domain.record.entity;

import com.dbapplication.kbo.domain.player.entity.Player;
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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pitcher_season_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PitcherSeasonRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "season")
    private Integer season;

    /** 평균자책점 */
    @Column(name = "pit_era", precision = 5, scale = 2)
    private BigDecimal pitEra;

    /** 경기 */
    @Column(name = "pit_games")
    private Integer pitGames;

    /** 완투 */
    @Column(name = "pit_cg")
    private Integer pitCg;

    /** 완봉 */
    @Column(name = "pit_sho")
    private Integer pitSho;

    /** 승 */
    @Column(name = "pit_w")
    private Integer pitW;

    /** 패 */
    @Column(name = "pit_l")
    private Integer pitL;

    /** 세이브 */
    @Column(name = "pit_sv")
    private Integer pitSv;

    /** 홀드 */
    @Column(name = "pit_hld")
    private Integer pitHld;

    /** 승률 */
    @Column(name = "pit_wpct", precision = 4, scale = 3)
    private BigDecimal pitWpct;

    /** 상대한 타자 수 */
    @Column(name = "pit_tbf")
    private Integer pitTbf;

    /** 투구 아웃 수 */
    @Column(name = "pit_outs")
    private Integer pitOuts;

    /** 피안타 */
    @Column(name = "pit_h")
    private Integer pitH;

    /** 피홈런 */
    @Column(name = "pit_hr")
    private Integer pitHr;

    /** 볼넷 */
    @Column(name = "pit_bb")
    private Integer pitBb;

    /** 사구 */
    @Column(name = "pit_hbp")
    private Integer pitHbp;

    /** 탈삼진 */
    @Column(name = "pit_so")
    private Integer pitSo;

    /** 실점 */
    @Column(name = "pit_r")
    private Integer pitR;

    /** 자책점 */
    @Column(name = "pit_er")
    private Integer pitEr;

    @Builder
    private PitcherSeasonRecord(Player player, Team team, Integer season, BigDecimal pitEra,
            Integer pitGames, Integer pitCg, Integer pitSho, Integer pitW, Integer pitL,
            Integer pitSv, Integer pitHld, BigDecimal pitWpct, Integer pitTbf, Integer pitOuts,
            Integer pitH, Integer pitHr, Integer pitBb, Integer pitHbp, Integer pitSo, Integer pitR,
            Integer pitEr) {
        this.player = player;
        this.team = team;
        this.season = season;
        this.pitEra = pitEra;
        this.pitGames = pitGames;
        this.pitCg = pitCg;
        this.pitSho = pitSho;
        this.pitW = pitW;
        this.pitL = pitL;
        this.pitSv = pitSv;
        this.pitHld = pitHld;
        this.pitWpct = pitWpct;
        this.pitTbf = pitTbf;
        this.pitOuts = pitOuts;
        this.pitH = pitH;
        this.pitHr = pitHr;
        this.pitBb = pitBb;
        this.pitHbp = pitHbp;
        this.pitSo = pitSo;
        this.pitR = pitR;
        this.pitEr = pitEr;
    }
}
