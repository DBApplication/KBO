package com.dbapplication.kbo.domain.match.repository;

import com.dbapplication.kbo.domain.match.entity.PitcherMatchRecord;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PitcherMatchRecordRepository extends JpaRepository<PitcherMatchRecord, Long> {

    /** 경기 상세의 등판 투수 (원정 → 홈, 등판 순서). 팀·선수를 함께 가져와 N+1 을 막는다. */
    @Query("""
            select r from PitcherMatchRecord r
            join fetch r.team
            left join fetch r.player
            where r.match.id = :matchId
            order by r.homeAway, r.seq
            """)
    List<PitcherMatchRecord> findByMatchId(@Param("matchId") Long matchId);

    /** 홈 화면 일별 선수 기록: 그 날짜 모든 경기의 투수. */
    @Query("""
            select r from PitcherMatchRecord r
            join fetch r.match m
            join fetch r.team
            left join fetch r.player
            where m.matchDate = :date
            order by m.matchTime, m.id, r.homeAway, r.seq
            """)
    List<PitcherMatchRecord> findByMatchDate(@Param("date") LocalDate date);
}
