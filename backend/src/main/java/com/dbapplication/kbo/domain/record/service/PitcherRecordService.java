package com.dbapplication.kbo.domain.record.service;

import static com.dbapplication.kbo.domain.record.service.RecordQuerySupport.atLeast;
import static com.dbapplication.kbo.domain.record.service.RecordQuerySupport.playerName;
import static com.dbapplication.kbo.domain.record.service.RecordQuerySupport.season;
import static com.dbapplication.kbo.domain.record.service.RecordQuerySupport.team;

import com.dbapplication.kbo.domain.player.repository.PlayerRepository;
import com.dbapplication.kbo.domain.record.dto.PitcherComparisonItem;
import com.dbapplication.kbo.domain.record.dto.PitcherRankingItem;
import com.dbapplication.kbo.domain.record.dto.PitcherSeasonResponse;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import com.dbapplication.kbo.domain.record.repository.PitcherSeasonRecordRepository;
import com.dbapplication.kbo.global.dto.PageResponse;
import com.dbapplication.kbo.global.error.BusinessException;
import com.dbapplication.kbo.global.error.ErrorCode;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PitcherRecordService {

    public static final String DEFAULT_SORT = "era";

    /** 정렬 키(API) → 엔티티 프로퍼티. innings 는 투구 아웃 수로 정렬한다. */
    static final Map<String, String> SORTABLE = Map.ofEntries(
            Map.entry("name", "player.name"),
            Map.entry("team", "team.name"),
            Map.entry("era", "pitEra"),
            Map.entry("games", "pitGames"),
            Map.entry("completeGames", "pitCg"),
            Map.entry("shutouts", "pitSho"),
            Map.entry("wins", "pitW"),
            Map.entry("losses", "pitL"),
            Map.entry("saves", "pitSv"),
            Map.entry("holds", "pitHld"),
            Map.entry("winPct", "pitWpct"),
            Map.entry("battersFaced", "pitTbf"),
            Map.entry("innings", "pitOuts"),
            Map.entry("hits", "pitH"),
            Map.entry("homeRuns", "pitHr"),
            Map.entry("walks", "pitBb"),
            Map.entry("hitByPitch", "pitHbp"),
            Map.entry("strikeouts", "pitSo"),
            Map.entry("runs", "pitR"),
            Map.entry("earnedRuns", "pitEr"));

    private final PitcherSeasonRecordRepository recordRepository;
    private final PlayerRepository playerRepository;

    public PageResponse<PitcherRankingItem> ranking(int seasonValue, Long teamId, String keyword, Integer minInnings,
            String sort, boolean desc, int page, int size) {
        Specification<PitcherSeasonRecord> spec = RecordQuerySupport.allOf(
                season(seasonValue), team(teamId), playerName(keyword), atLeast("pitOuts", minInnings == null ? null : minInnings * 3));
        var pageable = RecordQuerySupport.pageable(SORTABLE, sort, desc, page, size);
        Page<PitcherSeasonRecord> result = recordRepository.findAll(spec, pageable);

        long offset = pageable.getOffset();
        List<PitcherRankingItem> content = IntStream.range(0, result.getNumberOfElements())
                .mapToObj(i -> PitcherRankingItem.of((int) offset + i + 1, result.getContent().get(i)))
                .toList();
        return new PageResponse<>(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    public List<PitcherSeasonResponse> findByPlayer(Long playerId) {
        if (!playerRepository.existsById(playerId)) {
            throw new BusinessException(ErrorCode.PLAYER_NOT_FOUND);
        }
        return recordRepository.findByPlayerIdOrderBySeasonDesc(playerId).stream()
                .map(PitcherSeasonResponse::from).toList();
    }

    /** 요청한 선수 순서를 유지한다. 기록이 없는 선수가 하나라도 있으면 404. */
    public List<PitcherComparisonItem> compare(int seasonValue, List<Long> playerIds) {
        Map<Long, PitcherSeasonRecord> byPlayer = new java.util.HashMap<>();
        recordRepository.findBySeasonAndPlayerIdIn(seasonValue, playerIds)
                .forEach(r -> byPlayer.putIfAbsent(r.getPlayer().getId(), r));
        return playerIds.stream().map(id -> {
            PitcherSeasonRecord r = byPlayer.get(id);
            if (r == null) {
                throw new BusinessException(ErrorCode.RECORD_NOT_FOUND);
            }
            return PitcherComparisonItem.from(r);
        }).toList();
    }
}
