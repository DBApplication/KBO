package com.dbapplication.kbo.domain.record.repository;

import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface PitcherSeasonRecordRepository
        extends JpaRepository<PitcherSeasonRecord, Long>, JpaSpecificationExecutor<PitcherSeasonRecord> {

    @Override
    @EntityGraph(attributePaths = {"player", "team"})
    Page<PitcherSeasonRecord> findAll(Specification<PitcherSeasonRecord> spec, Pageable pageable);

    @EntityGraph(attributePaths = "team")
    List<PitcherSeasonRecord> findByPlayerIdOrderBySeasonDesc(Long playerId);

    @EntityGraph(attributePaths = {"player", "player.team", "team"})
    List<PitcherSeasonRecord> findBySeasonAndPlayerIdIn(Integer season, Collection<Long> playerIds);

    @Query("select distinct r.season from PitcherSeasonRecord r where r.season is not null")
    List<Integer> findDistinctSeasons();
}
