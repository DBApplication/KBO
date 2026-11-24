package com.dbapplication.kbo.domain.team.service;

import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import com.dbapplication.kbo.domain.team.repository.TeamRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;

    public List<TeamSummary> findAll() {
        return teamRepository.findAll(Sort.by("name")).stream().map(TeamSummary::from).toList();
    }
}
