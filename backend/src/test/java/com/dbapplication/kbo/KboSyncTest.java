package com.dbapplication.kbo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dbapplication.kbo.domain.collect.service.KboSyncService;
import com.dbapplication.kbo.domain.collect.source.KboGame;
import com.dbapplication.kbo.domain.collect.source.KboGameCenterClient;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

/**
 * KBO 수집 → 정제 → 검증 → 적재를 실제 PostgreSQL 에 돌린다.
 * KBO 서버 대신 실제 게임센터 응답을 저장해 둔 파일(test/resources/kbo)을 돌려준다.
 *  - 2025-06-01 두산:키움 (종료, 박스스코어 포함)
 *  - 2025-04-05 KIA:LG (우천취소)
 *  - 2025-04-06 KIA:LG (예정) — 시즌이 끝나 실제 예정 응답이 없어 4/5 응답의 상태 값만 '예정'으로 바꾼 것
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@Sql("/sql/kbo_sync_seed.sql")
@Sql(scripts = "/sql/kbo_sync_cleanup.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
class KboSyncTest {

    @MockitoBean
    KboGameCenterClient client;

    @Autowired
    KboSyncService service;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MockMvc mockMvc;

    @BeforeEach
    void kboResponses() {
        given(client.gameList(LocalDate.of(2025, 6, 1))).willReturn(fixture("gamelist_20250601.json"));
        given(client.gameList(LocalDate.of(2025, 4, 5))).willReturn(fixture("gamelist_20250405.json"));
        given(client.gameList(LocalDate.of(2025, 4, 6))).willReturn(fixture("gamelist_20250406_scheduled.json"));
        given(client.gameList(LocalDate.of(2025, 12, 24))).willReturn("{\"game\": [], \"code\": \"100\", \"msg\": \"성공\"}");
        given(client.scoreBoard(any(KboGame.class))).willReturn(fixture("scoreboard_20250601OBWO0.json"));
        given(client.boxScore(any(KboGame.class))).willReturn(fixture("boxscore_20250601OBWO0.json"));
    }

    @Test
    @DisplayName("종료 경기: 경기·R/H/E·이닝 점수·선수 기록·주요 기록을 넣고, 다시 돌려도 결과가 같다")
    void finishedGame() {
        List<KboSyncService.SyncResult> first = service.sync(List.of(LocalDate.of(2025, 6, 1)), "MANUAL");
        assertThat(first).singleElement().satisfies(r -> {
            assertThat(r.status()).isEqualTo("SUCCESS");
            assertThat(r.loaded()).isEqualTo(1);
        });

        assertThat(jdbc.queryForMap("SELECT status, home_score, away_score, stadium FROM matches WHERE kbo_game_id = '20250601_OBWO0'"))
                .containsEntry("status", "FINISHED").containsEntry("home_score", 1).containsEntry("away_score", 0)
                .containsEntry("stadium", "고척");
        assertThat(jdbc.queryForList("SELECT home_away || runs || '/' || hits || '/' || errors FROM match_team_record ORDER BY home_away", String.class))
                .containsExactly("AWAY0/9/2", "HOME1/5/1");
        assertThat(jdbc.queryForObject("SELECT count(*) || ':' || sum(runs) FROM match_inning_score", String.class))
                .isEqualTo("17:1");
        String counts = "SELECT (SELECT count(*) FROM batter_match_record) || '/' || (SELECT count(*) FROM pitcher_match_record)"
                + " || '/' || (SELECT count(*) FROM match_event) || '/' || (SELECT count(*) FROM matches)";
        String before = jdbc.queryForObject(counts, String.class);
        // 같은 경기를 CSV 로 넣었을 때(data/daily)와 같은 수: 타자 25, 투수 6, 주요 기록 11
        assertThat(before).isEqualTo("25/6/11/1");
        assertThat(jdbc.queryForList("SELECT event_type || '|' || description FROM match_event ORDER BY id", String.class))
                .containsExactly("결승타|김재현(2회 2사 1,2루서 중전 안타)", "2루타|김준상(1회) 임종성2(4 6회)",
                        "실책|오선진(4회) 박준순(4회) 최승용(7회)", "주루사|박계범(4회)", "병살타|최주환(5회)",
                        "심판|이영재 배병두 최수원 차정구", "구장|고척", "관중|12,350", "개시|14:00", "종료|16:39",
                        "경기시간|2:39");

        service.sync(List.of(LocalDate.of(2025, 6, 1)), "MANUAL");
        assertThat(jdbc.queryForObject(counts, String.class)).isEqualTo(before);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM kbo_sync_run WHERE status = 'SUCCESS'", Integer.class))
                .isEqualTo(2);
    }

    @Test
    @DisplayName("우천취소·예정 경기는 경기 한 줄만 넣고, 경기 없는 날은 NO_GAMES 로 남긴다")
    void canceledScheduledAndEmpty() {
        List<KboSyncService.SyncResult> results = service.sync(
                List.of(LocalDate.of(2025, 4, 5), LocalDate.of(2025, 4, 6), LocalDate.of(2025, 12, 24)), "MANUAL");

        assertThat(results).extracting(KboSyncService.SyncResult::status).containsExactly("SUCCESS", "SUCCESS", "NO_GAMES");
        assertThat(jdbc.queryForList("SELECT kbo_game_id || ' ' || status || ' ' || coalesce(home_score::text, '-') FROM matches ORDER BY kbo_game_id", String.class))
                .containsExactly("20250405_HTLG0 CANCELED -", "20250406_HTLG0 SCHEDULED -");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM match_team_record", Integer.class)).isZero();
    }

    @Test
    @DisplayName("예정 경기는 홈팀 구단 예매 페이지로 예매하기, 취소 경기는 버튼 없음")
    void ticketButton() throws Exception {
        service.sync(List.of(LocalDate.of(2025, 4, 5), LocalDate.of(2025, 4, 6)), "MANUAL");

        mockMvc.perform(get("/api/matches").param("date", "2025-04-06"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("SCHEDULED"))
                .andExpect(jsonPath("$[0].homeTeam.code").value("LG"))
                .andExpect(jsonPath("$[0].actions.ticketUrl").value("https://www.ticketlink.co.kr/sports"))
                .andExpect(jsonPath("$[0].actions.showRecord").value(false));
        mockMvc.perform(get("/api/matches").param("date", "2025-04-05"))
                .andExpect(jsonPath("$[0].status").value("CANCELED"))
                .andExpect(jsonPath("$[0].actions.ticketUrl").value(nullValue()))
                .andExpect(jsonPath("$[0].actions.showRecord").value(false));
    }

    @Test
    @DisplayName("관리자 수집 API 는 토큰이 설정되지 않으면 막혀 있다")
    void adminApiClosedWithoutToken() throws Exception {
        mockMvc.perform(post("/api/admin/kbo-sync").param("date", "2025-06-01"))
                .andExpect(status().isForbidden());
    }

    private static String fixture(String name) {
        try {
            return new ClassPathResource("kbo/" + name).getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
