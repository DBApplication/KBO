package com.dbapplication.kbo.domain.match.repository;

import com.dbapplication.kbo.domain.match.entity.Match;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchRepository extends JpaRepository<Match, Long> {

    /** 날짜별 경기 목록. 홈·원정 팀을 한 번에 가져와 N+1 을 막는다. */
    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            where m.matchDate = :date
              and (:teamId is null or m.homeTeam.id = :teamId or m.awayTeam.id = :teamId)
              and (:status is null or m.status = :status)
            order by m.matchTime, m.doubleheader, m.id
            """)
    List<Match> findByDate(@Param("date") LocalDate date, @Param("teamId") Long teamId,
            @Param("status") String status);

    @Query("""
            select m from Match m
            join fetch m.homeTeam
            join fetch m.awayTeam
            where m.id = :id
            """)
    Optional<Match> findWithTeamsById(@Param("id") Long id);

    /** 달력에 점을 찍을 날짜들 (선택한 팀의 경기가 있는 날). */
    @Query("""
            select distinct m.matchDate from Match m
            where m.matchDate between :from and :to
              and (:teamId is null or m.homeTeam.id = :teamId or m.awayTeam.id = :teamId)
            order by m.matchDate
            """)
    List<LocalDate> findMatchDates(@Param("from") LocalDate from, @Param("to") LocalDate to,
            @Param("teamId") Long teamId);
}
