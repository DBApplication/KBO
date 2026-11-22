package com.dbapplication.kbo.domain.record.repository;

import com.dbapplication.kbo.domain.record.entity.TeamSeasonRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TeamSeasonRecordRepository extends JpaRepository<TeamSeasonRecord, Long> {

    @Query("select distinct t.season from TeamSeasonRecord t order by t.season desc")
    List<Integer> findSeasons();

    @Query("select max(t.asOfDate) from TeamSeasonRecord t where t.season = :season")
    Optional<LocalDate> findLatestAsOfDate(@Param("season") Integer season);

    @Query("""
            select t from TeamSeasonRecord t
            join fetch t.team
            where t.season = :season and t.asOfDate = :asOfDate
            order by t.teamRank, t.team.id
            """)
    List<TeamSeasonRecord> findStandings(@Param("season") Integer season,
            @Param("asOfDate") LocalDate asOfDate);
}
