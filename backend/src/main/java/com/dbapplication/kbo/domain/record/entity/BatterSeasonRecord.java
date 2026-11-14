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
@Table(name = "batter_season_record")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BatterSeasonRecord {

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

    /** 타율 */
    @Column(name = "bat_avg", precision = 4, scale = 3)
    private BigDecimal batAvg;

    /** 경기 */
    @Column(name = "bat_games")
    private Integer batGames;

    /** 타석 */
    @Column(name = "bat_pa")
    private Integer batPa;

    /** 타수 */
    @Column(name = "bat_ab")
    private Integer batAb;

    /** 득점 */
    @Column(name = "bat_r")
    private Integer batR;

    /** 안타 */
    @Column(name = "bat_h")
    private Integer batH;

    /** 2루타 */
    @Column(name = "bat_2b")
    private Integer bat2b;

    /** 3루타 */
    @Column(name = "bat_3b")
    private Integer bat3b;

    /** 홈런 */
    @Column(name = "bat_hr")
    private Integer batHr;

    /** 루타 */
    @Column(name = "bat_tb")
    private Integer batTb;

    /** 타점 */
    @Column(name = "bat_rbi")
    private Integer batRbi;

    /** 도루 */
    @Column(name = "bat_sb")
    private Integer batSb;

    /** 도루 실패 */
    @Column(name = "bat_cs")
    private Integer batCs;

    /** 볼넷 */
    @Column(name = "bat_bb")
    private Integer batBb;

    /** 사구 */
    @Column(name = "bat_hbp")
    private Integer batHbp;

    /** 삼진 */
    @Column(name = "bat_so")
    private Integer batSo;

    /** 병살타 */
    @Column(name = "bat_gdp")
    private Integer batGdp;

    /** 장타율 */
    @Column(name = "bat_slg", precision = 4, scale = 3)
    private BigDecimal batSlg;

    /** 출루율 */
    @Column(name = "bat_obp", precision = 4, scale = 3)
    private BigDecimal batObp;

    /** 실책 */
    @Column(name = "bat_e")
    private Integer batE;

    /** OPS */
    @Column(name = "bat_ops", precision = 4, scale = 3)
    private BigDecimal batOps;

    @Builder
    private BatterSeasonRecord(Player player, Team team, Integer season, BigDecimal batAvg,
            Integer batGames, Integer batPa, Integer batAb, Integer batR, Integer batH,
            Integer bat2b, Integer bat3b, Integer batHr, Integer batTb, Integer batRbi,
            Integer batSb, Integer batCs, Integer batBb, Integer batHbp, Integer batSo,
            Integer batGdp, BigDecimal batSlg, BigDecimal batObp, Integer batE, BigDecimal batOps) {
        this.player = player;
        this.team = team;
        this.season = season;
        this.batAvg = batAvg;
        this.batGames = batGames;
        this.batPa = batPa;
        this.batAb = batAb;
        this.batR = batR;
        this.batH = batH;
        this.bat2b = bat2b;
        this.bat3b = bat3b;
        this.batHr = batHr;
        this.batTb = batTb;
        this.batRbi = batRbi;
        this.batSb = batSb;
        this.batCs = batCs;
        this.batBb = batBb;
        this.batHbp = batHbp;
        this.batSo = batSo;
        this.batGdp = batGdp;
        this.batSlg = batSlg;
        this.batObp = batObp;
        this.batE = batE;
        this.batOps = batOps;
    }
}
