package com.dbapplication.kbo.domain.team.entity;

import com.dbapplication.kbo.domain.match.entity.Match;
import com.dbapplication.kbo.domain.player.entity.Player;
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

    @Column(name = "name", nullable = false, length = 50)
    private String name;

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

    @Builder
    private Team(String name, String homeStadium, String logoUrl) {
        this.name = name;
        this.homeStadium = homeStadium;
        this.logoUrl = logoUrl;
    }
}
