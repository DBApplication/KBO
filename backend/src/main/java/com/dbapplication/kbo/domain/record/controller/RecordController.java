package com.dbapplication.kbo.domain.record.controller;

import io.swagger.v3.oas.annotations.Parameter;
import com.dbapplication.kbo.domain.record.dto.BatterComparisonItem;
import com.dbapplication.kbo.domain.record.dto.BatterRankingItem;
import com.dbapplication.kbo.domain.record.dto.BatterSeasonResponse;
import com.dbapplication.kbo.domain.record.dto.PitcherComparisonItem;
import com.dbapplication.kbo.domain.record.dto.PitcherRankingItem;
import com.dbapplication.kbo.domain.record.dto.PitcherSeasonResponse;
import com.dbapplication.kbo.domain.record.service.BatterRecordService;
import com.dbapplication.kbo.domain.record.service.PitcherRecordService;
import com.dbapplication.kbo.domain.record.service.RecordSeasonService;
import com.dbapplication.kbo.global.dto.PageResponse;
import com.dbapplication.kbo.global.error.BusinessException;
import com.dbapplication.kbo.global.error.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Record")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RecordController {

    private final BatterRecordService batterService;
    private final PitcherRecordService pitcherService;
    private final RecordSeasonService seasonService;

    @Operation(summary = "기록이 있는 시즌 목록 (최신순)")
    @GetMapping("/records/seasons")
    public List<Integer> seasons() {
        return seasonService.findSeasons();
    }

    @Operation(summary = "[선수 기록] 타자 기록 목록",
            description = "sort: name,team,avg,games,pa,ab,runs,hits,doubles,triples,homeRuns,totalBases,rbi,"
                    + "stolenBases,caughtStealing,walks,hitByPitch,strikeouts,gdp,slg,obp,errors,ops. "
                    + "order: asc|desc (기본 desc). minPa 로 타석 제한을 건다.")
    @GetMapping("/records/batters")
    public PageResponse<BatterRankingItem> batters(
            @Parameter(description = "시즌 (연도)", example = "2025") @RequestParam int season,
            @Parameter(description = "팀 ID 필터 (미지정 시 전체 팀)") @RequestParam(required = false) Long teamId,
            @Parameter(description = "선수 이름 검색어 (부분 일치, 대소문자 무시)") @RequestParam(required = false) String keyword,
            @Parameter(description = "최소 타석 (타석 제한). 미지정 시 제한 없음", example = "300") @RequestParam(required = false) Integer minPa,
            @Parameter(description = "정렬 기준 키 (허용 값은 operation 설명 참고)") @RequestParam(defaultValue = BatterRecordService.DEFAULT_SORT) String sort,
            @Parameter(description = "정렬 방향: asc | desc") @RequestParam(defaultValue = "desc") String order,
            @Parameter(description = "페이지 번호 (0부터)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기 (최대 100)", example = "50") @RequestParam(defaultValue = "50") int size) {
        return batterService.ranking(season, teamId, keyword, minPa, sort, isDesc(order), page, size);
    }

    @Operation(summary = "[선수 기록] 투수 기록 목록",
            description = "sort: name,team,era,games,completeGames,shutouts,wins,losses,saves,holds,winPct,"
                    + "battersFaced,innings,hits,homeRuns,walks,hitByPitch,strikeouts,runs,earnedRuns. "
                    + "order: asc|desc (기본 asc, ERA 낮은 순). minInnings 로 이닝 제한을 건다.")
    @GetMapping("/records/pitchers")
    public PageResponse<PitcherRankingItem> pitchers(
            @Parameter(description = "시즌 (연도)", example = "2025") @RequestParam int season,
            @Parameter(description = "팀 ID 필터 (미지정 시 전체 팀)") @RequestParam(required = false) Long teamId,
            @Parameter(description = "선수 이름 검색어 (부분 일치, 대소문자 무시)") @RequestParam(required = false) String keyword,
            @Parameter(description = "최소 이닝 (이닝 제한). 미지정 시 제한 없음", example = "100") @RequestParam(required = false) Integer minInnings,
            @Parameter(description = "정렬 기준 키 (허용 값은 operation 설명 참고)") @RequestParam(defaultValue = PitcherRecordService.DEFAULT_SORT) String sort,
            @Parameter(description = "정렬 방향: asc | desc") @RequestParam(defaultValue = "asc") String order,
            @Parameter(description = "페이지 번호 (0부터)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기 (최대 100)", example = "50") @RequestParam(defaultValue = "50") int size) {
        return pitcherService.ranking(season, teamId, keyword, minInnings, sort, isDesc(order), page, size);
    }

    @Operation(summary = "[선수 상세] 연도별 타격 기록 (최신 시즌부터)")
    @GetMapping("/players/{playerId}/records/batter")
    public List<BatterSeasonResponse> batterHistory(@Parameter(description = "선수 ID", example = "1") @PathVariable Long playerId) {
        return batterService.findByPlayer(playerId);
    }

    @Operation(summary = "[선수 상세] 연도별 투구 기록 (최신 시즌부터)")
    @GetMapping("/players/{playerId}/records/pitcher")
    public List<PitcherSeasonResponse> pitcherHistory(@Parameter(description = "선수 ID", example = "1") @PathVariable Long playerId) {
        return pitcherService.findByPlayer(playerId);
    }

    @Operation(summary = "[선수 비교] 타자 두 명 비교", description = "playerIds=1,2 (정확히 서로 다른 2명, 요청 순서 유지)")
    @GetMapping("/records/batters/compare")
    public List<BatterComparisonItem> compareBatters(@Parameter(description = "시즌 (연도)", example = "2025") @RequestParam int season,
            @Parameter(description = "비교할 선수 ID 2개, 쉼표 구분 (서로 달라야 하며 응답은 이 순서)", example = "1,2") @RequestParam List<Long> playerIds) {
        return batterService.compare(season, validatePair(playerIds));
    }

    @Operation(summary = "[선수 비교] 투수 두 명 비교", description = "playerIds=1,2 (정확히 서로 다른 2명, 요청 순서 유지)")
    @GetMapping("/records/pitchers/compare")
    public List<PitcherComparisonItem> comparePitchers(@Parameter(description = "시즌 (연도)", example = "2025") @RequestParam int season,
            @Parameter(description = "비교할 선수 ID 2개, 쉼표 구분 (서로 달라야 하며 응답은 이 순서)", example = "1,2") @RequestParam List<Long> playerIds) {
        return pitcherService.compare(season, validatePair(playerIds));
    }

    private static boolean isDesc(String order) {
        if ("desc".equalsIgnoreCase(order)) {
            return true;
        }
        if ("asc".equalsIgnoreCase(order)) {
            return false;
        }
        throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "order 는 asc 또는 desc 여야 합니다.");
    }

    private static List<Long> validatePair(List<Long> ids) {
        if (ids.size() != 2 || ids.get(0).equals(ids.get(1))) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE, "서로 다른 선수 2명을 선택해야 합니다.");
        }
        return ids;
    }
}
