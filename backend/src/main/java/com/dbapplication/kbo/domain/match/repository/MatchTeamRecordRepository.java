package com.dbapplication.kbo.domain.match.repository;

import com.dbapplication.kbo.domain.match.entity.MatchTeamRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchTeamRecordRepository extends JpaRepository<MatchTeamRecord, Long> {

    List<MatchTeamRecord> findByMatchId(Long matchId);
}
