package com.dbapplication.kbo.domain.record.service;

import static com.dbapplication.kbo.domain.record.service.RecordQuerySupport.atLeast;
import static com.dbapplication.kbo.domain.record.service.RecordQuerySupport.playerName;
import static com.dbapplication.kbo.domain.record.service.RecordQuerySupport.season;
import static com.dbapplication.kbo.domain.record.service.RecordQuerySupport.team;

import com.dbapplication.kbo.domain.player.repository.PlayerRepository;
import com.dbapplication.kbo.domain.record.dto.BatterComparisonItem;
import com.dbapplication.kbo.domain.record.dto.BatterRankingItem;
import com.dbapplication.kbo.domain.record.dto.BatterSeasonResponse;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.record.repository.BatterSeasonRecordRepository;
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
public class BatterRecordService {

    public static final String DEFAULT_SORT = "ops";

    /** 정렬 키(API) → 엔티티 프로퍼티. */
    static final Map<String, String> SORTABLE = Map.ofEntries(
            Map.entry("name", "player.name"),
            Map.entry("team", "team.name"),
            Map.entry("avg", "batAvg"),
            Map.entry("games", "batGames"),
            Map.entry("pa", "batPa"),
            Map.entry("ab", "batAb"),
            Map.entry("runs", "batR"),
            Map.entry("hits", "batH"),
            Map.entry("doubles", "bat2b"),
            Map.entry("triples", "bat3b"),
            Map.entry("homeRuns", "batHr"),
            Map.entry("totalBases", "batTb"),
            Map.entry("rbi", "batRbi"),
            Map.entry("stolenBases", "batSb"),
            Map.entry("caughtStealing", "batCs"),
            Map.entry("walks", "batBb"),
            Map.entry("hitByPitch", "batHbp"),
            Map.entry("strikeouts", "batSo"),
            Map.entry("gdp", "batGdp"),
            Map.entry("slg", "batSlg"),
            Map.entry("obp", "batObp"),
            Map.entry("errors", "batE"),
            Map.entry("ops", "batOps"));

    private final BatterSeasonRecordRepository recordRepository;
    private final PlayerRepository playerRepository;

    public PageResponse<BatterRankingItem> ranking(int seasonValue, Long teamId, String keyword, Integer minPa,
            String sort, boolean desc, int page, int size) {
        Specification<BatterSeasonRecord> spec = RecordQuerySupport.allOf(
                season(seasonValue), team(teamId), playerName(keyword), atLeast("batPa", minPa));
        var pageable = RecordQuerySupport.pageable(SORTABLE, sort, desc, page, size);
        Page<BatterSeasonRecord> result = recordRepository.findAll(spec, pageable);

        long offset = pageable.getOffset();
        List<BatterRankingItem> content = IntStream.range(0, result.getNumberOfElements())
                .mapToObj(i -> BatterRankingItem.of((int) offset + i + 1, result.getContent().get(i)))
                .toList();
        return new PageResponse<>(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    public List<BatterSeasonResponse> findByPlayer(Long playerId) {
        if (!playerRepository.existsById(playerId)) {
            throw new BusinessException(ErrorCode.PLAYER_NOT_FOUND);
        }
        return recordRepository.findByPlayerIdOrderBySeasonDesc(playerId).stream()
                .map(BatterSeasonResponse::from).toList();
    }

    /** 요청한 선수 순서를 유지한다. 기록이 없는 선수가 하나라도 있으면 404. */
    public List<BatterComparisonItem> compare(int seasonValue, List<Long> playerIds) {
        Map<Long, BatterSeasonRecord> byPlayer = new java.util.HashMap<>();
        recordRepository.findBySeasonAndPlayerIdIn(seasonValue, playerIds)
                .forEach(r -> byPlayer.putIfAbsent(r.getPlayer().getId(), r));
        return playerIds.stream().map(id -> {
            BatterSeasonRecord r = byPlayer.get(id);
            if (r == null) {
                throw new BusinessException(ErrorCode.RECORD_NOT_FOUND);
            }
            return BatterComparisonItem.from(r);
        }).toList();
    }
}
