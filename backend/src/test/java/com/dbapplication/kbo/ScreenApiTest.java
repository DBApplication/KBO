package com.dbapplication.kbo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dbapplication.kbo.domain.player.entity.Player;
import com.dbapplication.kbo.domain.player.repository.PlayerRepository;
import com.dbapplication.kbo.domain.record.entity.BatterSeasonRecord;
import com.dbapplication.kbo.domain.record.entity.PitcherSeasonRecord;
import com.dbapplication.kbo.domain.record.repository.BatterSeasonRecordRepository;
import com.dbapplication.kbo.domain.record.repository.PitcherSeasonRecordRepository;
import com.dbapplication.kbo.domain.team.entity.Team;
import com.dbapplication.kbo.domain.team.repository.TeamRepository;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** 화면별 조회 API 통합 테스트 (선수 기록 / 선수 상세 / 선수 비교). */
@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ScreenApiTest {

    @Autowired MockMvc mvc;
    @Autowired TeamRepository teams;
    @Autowired PlayerRepository players;
    @Autowired BatterSeasonRecordRepository batters;
    @Autowired PitcherSeasonRecordRepository pitchers;

    Team lg;
    Team kia;
    Player austin;
    Player kim;
    Player lim;
    Player ku;

    @BeforeEach
    void seed() {
        lg = teams.save(Team.builder().name("LG").build());
        kia = teams.save(Team.builder().name("KIA").build());
        austin = players.save(Player.builder().team(lg).name("오스틴").position("내야수").build());
        kim = players.save(Player.builder().team(kia).name("김도영").position("내야수").build());
        lim = players.save(Player.builder().team(lg).name("임찬규").position("투수").build());
        ku = players.save(Player.builder().team(kia).name("구자욱").position("투수").build());

        batters.save(batter(austin, lg, 2025, "1.002", 440));
        batters.save(batter(austin, lg, 2024, "0.914", 400));
        batters.save(batter(kim, kia, 2025, "0.943", 30));
        pitchers.save(pitcher(lim, lg, 2025, "2.85", 544));
        pitchers.save(pitcher(ku, kia, 2025, "3.10", 100));
    }

    @Test
    void 타자_기록은_OPS_내림차순이며_순위가_붙는다() throws Exception {
        mvc.perform(get("/api/records/batters").param("season", "2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].rank").value(1))
                .andExpect(jsonPath("$.content[0].player.name").value("오스틴"))
                .andExpect(jsonPath("$.content[0].team.name").value("LG"))
                .andExpect(jsonPath("$.content[1].rank").value(2));
    }

    @Test
    void 타자_기록_팀_검색_타석제한_필터() throws Exception {
        mvc.perform(get("/api/records/batters").param("season", "2025").param("teamId", kia.getId().toString()))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].player.name").value("김도영"));
        mvc.perform(get("/api/records/batters").param("season", "2025").param("keyword", "오스"))
                .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/records/batters").param("season", "2025").param("minPa", "100"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].player.name").value("오스틴"));
    }

    @Test
    void 타자_기록_정렬_파라미터() throws Exception {
        mvc.perform(get("/api/records/batters").param("season", "2025").param("sort", "name").param("order", "asc"))
                .andExpect(jsonPath("$.content[0].player.name").value("김도영"));
        mvc.perform(get("/api/records/batters").param("season", "2025").param("sort", "bogus"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("C001"));
    }

    @Test
    void 투수_기록은_ERA_오름차순이고_이닝이_표기된다() throws Exception {
        mvc.perform(get("/api/records/pitchers").param("season", "2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].player.name").value("임찬규"))
                .andExpect(jsonPath("$.content[0].stats.innings").value("181 1/3"))
                .andExpect(jsonPath("$.content[1].player.name").value("구자욱"))
                .andExpect(jsonPath("$.content[1].stats.innings").value("33 1/3"));
        mvc.perform(get("/api/records/pitchers").param("season", "2025").param("minInnings", "100"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void 시즌_목록은_최신순() throws Exception {
        mvc.perform(get("/api/records/seasons"))
                .andExpect(jsonPath("$[0]").value(2025))
                .andExpect(jsonPath("$[1]").value(2024));
    }

    @Test
    void 팀_목록() throws Exception {
        mvc.perform(get("/api/teams"))
                .andExpect(jsonPath("$[0].name").value("KIA"))
                .andExpect(jsonPath("$[1].name").value("LG"));
    }

    @Test
    void 선수_검색과_타입_필터() throws Exception {
        mvc.perform(get("/api/players").param("keyword", "찬규"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].type").value("PITCHER"));
        mvc.perform(get("/api/players").param("type", "BATTER"))
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/players").param("keyword", "%"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void 선수_상세와_연도별_기록() throws Exception {
        mvc.perform(get("/api/players/{id}", austin.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("오스틴"))
                .andExpect(jsonPath("$.type").value("BATTER"))
                .andExpect(jsonPath("$.team.name").value("LG"));
        mvc.perform(get("/api/players/{id}/records/batter", austin.getId()))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].season").value(2025))
                .andExpect(jsonPath("$[1].season").value(2024));
        mvc.perform(get("/api/players/{id}/records/pitcher", lim.getId()))
                .andExpect(jsonPath("$[0].stats.innings").value("181 1/3"));
        mvc.perform(get("/api/players/{id}", 999999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("P001"));
        mvc.perform(get("/api/players/{id}/records/batter", 999999L))
                .andExpect(status().isNotFound());
    }

    @Test
    void 선수_비교는_요청_순서를_유지한다() throws Exception {
        mvc.perform(get("/api/records/batters/compare").param("season", "2025")
                        .param("playerIds", kim.getId() + "," + austin.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].player.name").value("김도영"))
                .andExpect(jsonPath("$[1].player.name").value("오스틴"))
                .andExpect(jsonPath("$[1].stats.ops").value(1.002));
        mvc.perform(get("/api/records/pitchers/compare").param("season", "2025")
                        .param("playerIds", ku.getId() + "," + lim.getId()))
                .andExpect(jsonPath("$[0].player.name").value("구자욱"));
    }

    @Test
    void 선수_비교_검증_오류() throws Exception {
        mvc.perform(get("/api/records/batters/compare").param("season", "2025")
                        .param("playerIds", austin.getId().toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/records/batters/compare").param("season", "2025")
                        .param("playerIds", austin.getId() + "," + austin.getId()))
                .andExpect(status().isBadRequest());
        // 투수는 타자 기록이 없음
        mvc.perform(get("/api/records/batters/compare").param("season", "2025")
                        .param("playerIds", austin.getId() + "," + lim.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("R001"));
    }

    private static BatterSeasonRecord batter(Player p, Team t, int season, String ops, int pa) {
        return BatterSeasonRecord.builder().player(p).team(t).season(season)
                .batOps(new BigDecimal(ops)).batPa(pa).batGames(100).build();
    }

    private static PitcherSeasonRecord pitcher(Player p, Team t, int season, String era, int outs) {
        return PitcherSeasonRecord.builder().player(p).team(t).season(season)
                .pitEra(new BigDecimal(era)).pitOuts(outs).pitGames(20).build();
    }
}
