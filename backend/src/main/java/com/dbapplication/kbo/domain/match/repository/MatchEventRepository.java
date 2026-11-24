package com.dbapplication.kbo.domain.match.repository;

import com.dbapplication.kbo.domain.match.entity.MatchEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchEventRepository extends JpaRepository<MatchEvent, Long> {

    List<MatchEvent> findByMatchIdOrderByIdAsc(Long matchId);
}
