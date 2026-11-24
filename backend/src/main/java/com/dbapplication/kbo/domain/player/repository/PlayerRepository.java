package com.dbapplication.kbo.domain.player.repository;

import com.dbapplication.kbo.domain.player.entity.Player;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PlayerRepository extends JpaRepository<Player, Long>, JpaSpecificationExecutor<Player> {

    @EntityGraph(attributePaths = "team")
    Optional<Player> findWithTeamById(Long id);

    @Override
    @EntityGraph(attributePaths = "team")
    Page<Player> findAll(Specification<Player> spec, Pageable pageable);
}
