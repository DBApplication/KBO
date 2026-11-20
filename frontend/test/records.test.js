import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseRecords,
  formatStat,
  sortRecords,
  shiftDate,
  safeLink,
  indexRecords,
} from "../records.js";
import { state } from "../ui.js";
import { home, gamePage } from "../games.js";
import { playerPage, comparePage, teamPage } from "../seasons.js";

/** 테스트가 실제 화면과 같은 CSV 파일을 사용하도록 파일을 읽어 기록 행으로 변환한다. */
const read = (name) =>
  parseRecords(
    readFileSync(
      new URL("../public/data/" + name + ".csv", import.meta.url),
      "utf8",
    ),
  );
const db = indexRecords({
  teams: read("team"),
  players: read("player"),
  games: read("matches"),
  videos: read("match_highlight"),
  standings: read("team_season_record"),
  bat: read("batter_season_record"),
  pit: read("pitcher_season_record"),
  dailyBat: read("daily/batting"),
  dailyPit: read("daily/pitching"),
  boxes: read("daily/team_game_stats"),
  innings: read("daily/team_innings"),
  events: read("daily/game_events"),
});
/** 화면 렌더링 테스트에 사용할 데이터와 주소 조건을 설정한다. */
function route(page, query = "") {
  state.db = db;
  state.page = page;
  state.params = new URLSearchParams(query);
}
test("CSV 따옴표, 쉼표, 빈 필드와 줄바꿈을 보존한다", () => {
  assert.deepEqual(parseRecords('\uFEFFa,b,c\r\n1,"x,""y""\nz",\r\n'), [
    { a: "1", b: 'x,"y"\nz', c: "" },
  ]);
});
test("빈 기록, 0, 분수 이닝을 구분한다", () => {
  assert.equal(formatStat("pit_outs", 19), "6⅓");
  assert.equal(formatStat("bat_avg", "0"), ".000");
  assert.equal(formatStat("pit_era", ""), "—");
  assert.deepEqual(
    sortRecords([{ v: "" }, { v: "0" }, { v: "2" }], "v", true).map((r) => r.v),
    ["0", "2", ""],
  );
  assert.equal(shiftDate("2025-01-01", -1), "2024-12-31");
  assert.equal(safeLink("javascript:alert(1)"), "");
});
test("6월 1일 실제 5경기와 박스스코어의 득점이 일치한다", () => {
  const games = db.byDate.get("2025-06-01");
  assert.equal(games.length, 5);
  for (const g of games)
    for (const side of ["home", "away"]) {
      const box = db.boxes.find(
        (b) => b.game_id === g.kbo_game_id && b.team_side === side,
      );
      assert.equal(g[side + "_score"], box.runs);
    }
  assert.equal(db.dailyBat.length, 124);
  assert.equal(db.dailyPit.length, 53);
  assert.ok(db.dailyBat.some((r) => !r.player_id));
});
test("경기 키와 선수·시즌·팀 복합키가 보존된다", () => {
  assert.equal(db.game.size, db.games.length);
  for (const group of [db.bat, db.pit]) {
    assert.equal(
      new Set(
        group.map((r) => [r.kbo_player_id, r.season, r.team_code].join("/")),
      ).size,
      group.length,
    );
    assert.ok(
      group.every(
        (r) => db.player.has(r.kbo_player_id) && db.team.has(r.team_code),
      ),
    );
  }
});
test("일별 기록과 시즌 기록, 미수집 상태를 분리한다", () => {
  route("home");
  assert.equal((home().match(/class="game-card"/g) || []).length, 5);
  route("home", "date=2025-06-03");
  assert.match(home(), /아직 수집되지 않았습니다/);
  route("game", "id=20250601_OBWO0");
  assert.match(gamePage(), /이닝별 득점/);
  route("players", "season=2025&q=김도영");
  assert.match(playerPage(), /김도영/);
  route("teams", "season=2024");
  assert.match(teamPage(), /2024.10.31/);
  route("compare", "type=pit");
  assert.match(comparePage(), /원태인/);
  assert.match(comparePage(), /김택연/);
});
