package com.dbapplication.kbo;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

/** 경기 기록 · 경기 상세 · 팀 기록 화면 API 를 실제 PostgreSQL(Testcontainers) + Flyway V1·V2 로 검증한다. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Sql("/sql/match_api_seed.sql")
@Sql(scripts = "/sql/match_api_cleanup.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
class MatchAndStandingsApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("날짜별 경기 목록: 시각순, 팀·점수·버튼 규칙")
    void matchesByDate() throws Exception {
        mockMvc.perform(get("/api/matches").param("date", "2025-06-01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].kboGameId").value("20250601_OBWO0"))
                .andExpect(jsonPath("$[0].matchTime").value("14:00:00"))
                .andExpect(jsonPath("$[0].awayTeam.shortName").value("두산"))
                .andExpect(jsonPath("$[0].homeTeam.code").value("WO"))
                .andExpect(jsonPath("$[0].result").value("HOME_WIN"))
                .andExpect(jsonPath("$[0].actions.showRecord").value(true))
                .andExpect(jsonPath("$[0].actions.highlightUrl").value("https://www.youtube.com/watch?v=a"))
                .andExpect(jsonPath("$[1].status").value("CANCELED"))
                .andExpect(jsonPath("$[1].result").value(nullValue()))
                .andExpect(jsonPath("$[1].actions.showRecord").value(false))
                .andExpect(jsonPath("$[1].actions.highlightUrl").value(nullValue()));
    }

    @Test
    @DisplayName("팀·상태 필터와 잘못된 상태 값")
    void filters() throws Exception {
        mockMvc.perform(get("/api/matches").param("date", "2025-06-01").param("status", "canceled"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(11));
        mockMvc.perform(get("/api/matches").param("date", "2025-06-01").param("teamId", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(get("/api/matches").param("date", "2025-06-01").param("status", "LIVE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("C001"));
    }

    @Test
    @DisplayName("예정 경기는 예매 버튼만, 무승부는 DRAW, 영상 2개면 목록으로")
    void scheduledAndDraw() throws Exception {
        mockMvc.perform(get("/api/matches").param("date", "2025-06-02"))
                .andExpect(jsonPath("$[0].actions.ticketUrl").value("https://ticket.example.com/12"))
                .andExpect(jsonPath("$[0].actions.showRecord").value(false));
        mockMvc.perform(get("/api/matches").param("date", "2025-06-03"))
                .andExpect(jsonPath("$[0].result").value("DRAW"))
                .andExpect(jsonPath("$[0].highlightCount").value(2))
                .andExpect(jsonPath("$[0].actions.highlightUrl").value(nullValue()))
                .andExpect(jsonPath("$[0].actions.highlightList").value(true));
    }

    @Test
    @DisplayName("경기 상세: 이닝별 기록표, 9회말 X, R/H/E")
    void matchDetailWithScoreboard() throws Exception {
        mockMvc.perform(get("/api/matches/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.highlights", hasSize(1)))
                .andExpect(jsonPath("$.scoreboard.innings").value(9))
                .andExpect(jsonPath("$.scoreboard.away.scores", contains("0", "0", "0", "0", "0", "0", "0", "0", "0")))
                .andExpect(jsonPath("$.scoreboard.home.scores", contains("0", "1", "0", "0", "0", "0", "0", "0", "X")))
                .andExpect(jsonPath("$.scoreboard.away.hits").value(9))
                .andExpect(jsonPath("$.scoreboard.away.errors").value(2))
                .andExpect(jsonPath("$.scoreboard.home.runs").value(1));
    }

    @Test
    @DisplayName("박스스코어 미수집 경기는 scoreboard = null, 없는 경기는 404")
    void matchDetailWithoutScoreboard() throws Exception {
        mockMvc.perform(get("/api/matches/14"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.highlights", hasSize(2)))
                .andExpect(jsonPath("$.scoreboard").value(nullValue()));
        mockMvc.perform(get("/api/matches/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("M001"));
    }

    @Test
    @DisplayName("달력: 기간 안에서 경기가 있는 날짜")
    void matchDates() throws Exception {
        mockMvc.perform(get("/api/matches/dates").param("from", "2025-05-31").param("to", "2025-06-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", contains("2025-06-01", "2025-06-02", "2025-06-03")));
        mockMvc.perform(get("/api/matches/dates").param("from", "2025-06-30").param("to", "2025-06-01"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("팀 순위: 시즌 생략 시 최신 시즌의 최신 기준일")
    void standings() throws Exception {
        mockMvc.perform(get("/api/standings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.season").value(2025))
                .andExpect(jsonPath("$.asOfDate").value("2025-10-31"))
                .andExpect(jsonPath("$.standings", hasSize(2)))
                .andExpect(jsonPath("$.standings[0].team.code").value("OB"))
                .andExpect(jsonPath("$.standings[0].draws").value(4))
                .andExpect(jsonPath("$.standings[1].winPct").value(0.336));
        mockMvc.perform(get("/api/standings").param("season", "2024"))
                .andExpect(jsonPath("$.asOfDate").value("2024-10-31"));
        mockMvc.perform(get("/api/standings/seasons"))
                .andExpect(jsonPath("$", contains(2025, 2024)));
        mockMvc.perform(get("/api/standings").param("season", "2019"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("R002"));
    }

    @Test
    @DisplayName("팀 목록")
    void teams() throws Exception {
        mockMvc.perform(get("/api/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].shortName").value("두산"));
    }
}
