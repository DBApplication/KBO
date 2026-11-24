package com.dbapplication.kbo.domain.team.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 구단별 예매 페이지. 예정 경기의 "예매하기" 버튼은 홈팀의 이 주소로 연결한다. */
@Entity
@Table(name = "team_ticket_site")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TeamTicketSite {

    /** team.code (OB, LG, ...) */
    @Id
    @Column(name = "team_code", length = 2)
    private String teamCode;

    @Column(name = "site_name", nullable = false, length = 50)
    private String siteName;

    @Column(name = "url", nullable = false, length = 500)
    private String url;
}
