package com.dbapplication.kbo.domain.match.repository;

import com.dbapplication.kbo.domain.match.entity.MatchInningScore;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchInningScoreRepository extends JpaRepository<MatchInningScore, Long> {

    List<MatchInningScore> findByMatchIdOrderByInningAsc(Long matchId);
}
