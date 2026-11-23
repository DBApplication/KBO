package com.dbapplication.kbo.domain.match.service;

import com.dbapplication.kbo.domain.match.dto.HighlightResponse;
import com.dbapplication.kbo.domain.match.dto.MatchDetailResponse;
import com.dbapplication.kbo.domain.match.dto.MatchSummaryResponse;
import com.dbapplication.kbo.domain.match.dto.ScoreboardResponse;
import com.dbapplication.kbo.domain.match.entity.HomeAway;
import com.dbapplication.kbo.domain.match.entity.Match;
import com.dbapplication.kbo.domain.match.entity.MatchHighlight;
import com.dbapplication.kbo.domain.match.entity.MatchInningScore;
import com.dbapplication.kbo.domain.match.entity.MatchStatus;
import com.dbapplication.kbo.domain.match.entity.MatchTeamRecord;
import com.dbapplication.kbo.domain.match.repository.MatchHighlightRepository;
import com.dbapplication.kbo.domain.match.repository.MatchInningScoreRepository;
import com.dbapplication.kbo.domain.match.repository.MatchRepository;
import com.dbapplication.kbo.domain.match.repository.MatchTeamRecordRepository;
import com.dbapplication.kbo.domain.team.dto.TeamSummary;
import com.dbapplication.kbo.global.error.BusinessException;
import com.dbapplication.kbo.global.error.ErrorCode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MatchService {

    /** 달력 조회는 한 번에 최대 1년까지. */
    private static final long MAX_DATE_RANGE_DAYS = 366;
    private static final int REGULATION_INNINGS = 9;

    private final MatchRepository matchRepository;
    private final MatchHighlightRepository highlightRepository;
    private final MatchTeamRecordRepository teamRecordRepository;
    private final MatchInningScoreRepository inningScoreRepository;

    /** 경기 기록 화면: 날짜 + 팀 + 상태 조건. 영상은 경기 수와 상관없이 쿼리 1번으로 붙인다. */
    public List<MatchSummaryResponse> getMatches(LocalDate date, Long teamId, String status) {
        String statusFilter = status == null || status.isBlank()
                ? null
                : MatchStatus.parse(status)
                        .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT_VALUE,
                                "status 는 " + Arrays.toString(MatchStatus.values()) + " 중 하나여야 합니다."))
                        .name();

        List<Match> matches = matchRepository.findByDate(date, teamId, statusFilter);
        if (matches.isEmpty()) {
            return List.of();
        }
        Map<Long, List<String>> urlsByMatch = highlightRepository
                .findByMatchIds(matches.stream().map(Match::getId).toList()).stream()
                .collect(Collectors.groupingBy(h -> h.getMatch().getId(),
                        Collectors.mapping(MatchHighlight::getUrl, Collectors.toList())));
        return matches.stream()
                .map(m -> MatchSummaryResponse.of(m, urlsByMatch.getOrDefault(m.getId(), List.of())))
                .toList();
    }

    /** 경기 상세: 점수 + 하이라이트 + 이닝별 기록표. */
    public MatchDetailResponse getMatch(Long matchId) {
        Match match = matchRepository.findWithTeamsById(matchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MATCH_NOT_FOUND));
        List<MatchHighlight> highlights = highlightRepository.findByMatchIds(List.of(matchId));
        List<String> urls = highlights.stream().map(MatchHighlight::getUrl).toList();
        return new MatchDetailResponse(
                MatchSummaryResponse.of(match, urls),
                highlights.stream().map(HighlightResponse::from).toList(),
                buildScoreboard(match));
    }

    /** 달력: 기간 안에서 경기가 있는 날짜만. */
    public List<LocalDate> getMatchDates(LocalDate from, LocalDate to, Long teamId) {
        if (from.isAfter(to) || ChronoUnit.DAYS.between(from, to) > MAX_DATE_RANGE_DAYS) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE,
                    "from 은 to 보다 늦을 수 없고, 기간은 최대 " + MAX_DATE_RANGE_DAYS + "일입니다.");
        }
        return matchRepository.findMatchDates(from, to, teamId);
    }

    private ScoreboardResponse buildScoreboard(Match match) {
        Map<HomeAway, MatchTeamRecord> totals = new EnumMap<>(HomeAway.class);
        for (MatchTeamRecord record : teamRecordRepository.findByMatchId(match.getId())) {
            totals.put(record.getHomeAway(), record);
        }
        if (totals.size() != 2) {
            return null; // 박스스코어 미수집
        }
        List<MatchInningScore> scores = inningScoreRepository.findByMatchIdOrderByInningAsc(match.getId());
        int innings = Math.max(REGULATION_INNINGS,
                scores.stream().mapToInt(MatchInningScore::getInning).max().orElse(0));

        Map<HomeAway, String[]> cells = new EnumMap<>(HomeAway.class);
        for (HomeAway side : HomeAway.values()) {
            cells.put(side, new String[innings]);
        }
        for (MatchInningScore score : scores) {
            cells.get(score.getHomeAway())[score.getInning() - 1] = String.valueOf(score.getRuns());
        }
        // 홈팀이 이기고 있어서 마지막 이닝 말 공격을 안 했으면 "X"
        String[] home = cells.get(HomeAway.HOME);
        String[] away = cells.get(HomeAway.AWAY);
        boolean homeWon = match.getHomeScore() != null && match.getAwayScore() != null
                && match.getHomeScore() > match.getAwayScore();
        if (homeWon && home[innings - 1] == null && away[innings - 1] != null) {
            home[innings - 1] = "X";
        }

        return new ScoreboardResponse(innings,
                line(TeamSummary.from(match.getAwayTeam()), away, totals.get(HomeAway.AWAY)),
                line(TeamSummary.from(match.getHomeTeam()), home, totals.get(HomeAway.HOME)));
    }

    private static ScoreboardResponse.Line line(TeamSummary team, String[] scores,
            MatchTeamRecord total) {
        return new ScoreboardResponse.Line(team, new ArrayList<>(Arrays.asList(scores)),
                total.getRuns(), total.getHits(), total.getErrors());
    }
}
