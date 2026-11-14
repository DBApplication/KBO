package com.dbapplication.kbo.domain.match.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Entity
@Table(name = "match_highlight")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchHighlight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "url", length = 500)
    private String url;

    @Builder
    private MatchHighlight(Match match, String title, String url) {
        this.match = match;
        this.title = title;
        this.url = url;
    }
}
