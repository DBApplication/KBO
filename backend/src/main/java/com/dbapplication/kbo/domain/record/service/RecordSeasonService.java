package com.dbapplication.kbo.domain.record.service;

import com.dbapplication.kbo.domain.record.repository.BatterSeasonRecordRepository;
import com.dbapplication.kbo.domain.record.repository.PitcherSeasonRecordRepository;
import java.util.List;
import java.util.TreeSet;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecordSeasonService {

    private final BatterSeasonRecordRepository batterRepository;
    private final PitcherSeasonRecordRepository pitcherRepository;

    /** 기록이 존재하는 시즌 목록 (최신순). 시즌 선택 드롭다운용. */
    public List<Integer> findSeasons() {
        TreeSet<Integer> seasons = new TreeSet<>(java.util.Comparator.reverseOrder());
        seasons.addAll(batterRepository.findDistinctSeasons());
        seasons.addAll(pitcherRepository.findDistinctSeasons());
        return List.copyOf(seasons);
    }
}
