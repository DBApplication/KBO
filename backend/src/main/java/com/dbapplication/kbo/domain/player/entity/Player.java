package com.dbapplication.kbo.domain.player.entity;

import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
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
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "position", length = 20)
    private String position;

    @Column(name = "throw_bat", length = 20)
    private String throwBat;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "height")
    private Integer height;

    @Column(name = "weight")
    private Integer weight;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @OneToMany(mappedBy = "player")
    private List<BatterSeasonRecord> batterSeasonRecords = new ArrayList<>();

    @OneToMany(mappedBy = "player")
    private List<PitcherSeasonRecord> pitcherSeasonRecords = new ArrayList<>();

    @Builder
    private Player(Team team, String name, String position, String throwBat, LocalDate birthDate,
            Integer height, Integer weight, String imageUrl) {
        this.team = team;
        this.name = name;
        this.position = position;
        this.throwBat = throwBat;
        this.birthDate = birthDate;
        this.height = height;
        this.weight = weight;
        this.imageUrl = imageUrl;
    }
}
