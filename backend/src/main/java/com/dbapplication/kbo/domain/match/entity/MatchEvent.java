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
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 경기 주요 기록 (결승타, 홈런, 2루타, 실책, 심판 등 박스스코어 아래 문장형 기록). */
@Entity
@Table(name = "match_event")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "item_no", nullable = false)
    private Integer itemNo;

    @Column(name = "description", nullable = false, length = 500)
    private String description;
}
