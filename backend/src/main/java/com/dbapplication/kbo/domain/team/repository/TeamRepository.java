package com.dbapplication.kbo.domain.team.repository;

import com.dbapplication.kbo.domain.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
}
