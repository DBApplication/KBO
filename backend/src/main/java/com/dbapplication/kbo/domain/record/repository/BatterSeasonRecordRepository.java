package com.dbapplication.kbo.domain.record.repository;

import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface BatterSeasonRecordRepository
        extends JpaRepository<BatterSeasonRecord, Long>, JpaSpecificationExecutor<BatterSeasonRecord> {

    @Override
    @EntityGraph(attributePaths = {"player", "team"})
    Page<BatterSeasonRecord> findAll(Specification<BatterSeasonRecord> spec, Pageable pageable);

    @EntityGraph(attributePaths = "team")
    List<BatterSeasonRecord> findByPlayerIdOrderBySeasonDesc(Long playerId);

    @EntityGraph(attributePaths = {"player", "player.team", "team"})
    List<BatterSeasonRecord> findBySeasonAndPlayerIdIn(Integer season, Collection<Long> playerIds);

    @Query("select distinct r.season from BatterSeasonRecord r where r.season is not null")
    List<Integer> findDistinctSeasons();
}
