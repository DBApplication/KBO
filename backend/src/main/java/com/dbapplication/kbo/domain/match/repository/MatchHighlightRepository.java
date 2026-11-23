package com.dbapplication.kbo.domain.match.repository;

import com.dbapplication.kbo.domain.match.entity.MatchHighlight;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MatchHighlightRepository extends JpaRepository<MatchHighlight, Long> {

    /** 목록에 나온 경기들의 영상을 쿼리 한 번으로 가져온다. */
    @Query("select h from MatchHighlight h where h.match.id in :matchIds order by h.id")
    List<MatchHighlight> findByMatchIds(@Param("matchIds") Collection<Long> matchIds);
}
