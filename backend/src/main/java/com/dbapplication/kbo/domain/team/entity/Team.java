package com.dbapplication.kbo.domain.team.entity;

import com.dbapplication.kbo.domain.match.entity.Match;
import com.dbapplication.kbo.domain.player.entity.Player;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "team")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** KBO 팀 코드 (OB, WO, LT ...). 크롤링 자료와 연결하는 키. */
    @Column(name = "code", length = 2, unique = true)
    private String code;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    /** 화면 표시용 약칭 (두산, KIA ...). */
    @Column(name = "short_name", length = 20)
    private String shortName;

    @Column(name = "home_stadium", length = 100)
    private String homeStadium;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @OneToMany(mappedBy = "team")
    private List<Player> players = new ArrayList<>();

    @OneToMany(mappedBy = "homeTeam")
    private List<Match> homeMatches = new ArrayList<>();

    @OneToMany(mappedBy = "awayTeam")
    private List<Match> awayMatches = new ArrayList<>();

    @OneToMany(mappedBy = "team")
    private List<BatterSeasonRecord> batterSeasonRecords = new ArrayList<>();

    @OneToMany(mappedBy = "team")
    private List<PitcherSeasonRecord> pitcherSeasonRecords = new ArrayList<>();

    @Builder
    private Team(String code, String name, String shortName, String homeStadium, String logoUrl) {
        this.code = code;
        this.name = name;
        this.shortName = shortName;
        this.homeStadium = homeStadium;
        this.logoUrl = logoUrl;
    }
}
