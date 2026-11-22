package com.dbapplication.kbo.domain.record.service;

import com.dbapplication.kbo.domain.record.dto.StandingsResponse;
import com.dbapplication.kbo.domain.record.repository.TeamSeasonRecordRepository;
import com.dbapplication.kbo.global.error.BusinessException;
import com.dbapplication.kbo.global.error.ErrorCode;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StandingsService {

    private final TeamSeasonRecordRepository teamSeasonRecordRepository;

    /** 시즌 선택 드롭다운 (최신 시즌부터). */
    public List<Integer> getSeasons() {
        return teamSeasonRecordRepository.findSeasons();
    }

    /** season 을 안 주면 가장 최근 시즌, 그 시즌의 가장 최근 기준일 순위를 준다. */
    public StandingsResponse getStandings(Integer season) {
        Integer target = season != null ? season : getSeasons().stream().findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.STANDINGS_NOT_FOUND));
        LocalDate asOfDate = teamSeasonRecordRepository.findLatestAsOfDate(target)
                .orElseThrow(() -> new BusinessException(ErrorCode.STANDINGS_NOT_FOUND,
                        target + " 시즌의 순위 기록이 없습니다."));
        return new StandingsResponse(target, asOfDate,
                teamSeasonRecordRepository.findStandings(target, asOfDate).stream()
                        .map(StandingsResponse.Row::from)
                        .toList());
    }
}
