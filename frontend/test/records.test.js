import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { formatStat, sortRecords, shiftDate, safeLink } from "../records.js";
import { loadReference, toGame, toBatterGame, clearCache } from "../api.js";
import { state } from "../ui.js";
import { home, gamePage } from "../games.js";
import {
  playerPage,
  playerDetail,
  comparePage,
  teamPage,
} from "../seasons.js";

/*
 * 화면 테스트는 백엔드 API 응답을 녹화한 파일(fixtures/api.json)로 돈다.
 * 백엔드에 실제 데이터를 넣고 서버를 켠 상태에서 아래처럼 실행하면 응답을 다시 녹화한다.
 *   KBO_RECORD_API=http://localhost:8080 npm test
 */
const FIXTURE = new URL("./fixtures/api.json", import.meta.url);
const recordFrom = process.env.KBO_RECORD_API;
const fixtures = recordFrom ? {} : JSON.parse(readFileSync(FIXTURE, "utf8"));
const requested = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url) => {
  requested.push(url);
  if (recordFrom) {
    const res = await realFetch(recordFrom + url);
    fixtures[url] = { status: res.status, body: await res.json() };
  }
  const saved = fixtures[url];
  if (!saved) throw new Error("녹화된 응답이 없습니다: " + url);
  return new Response(JSON.stringify(saved.body), { status: saved.status });
};
after(() => {
  if (recordFrom) writeFileSync(FIXTURE, JSON.stringify(fixtures, null, 1));
});

before(async () => {
  state.db = await loadReference();
});
/** 화면 렌더링 테스트에 사용할 주소 조건을 설정한다. */
function route(page, query = "") {
  state.page = page;
  state.params = new URLSearchParams(query);
  requested.length = 0;
}

test("빈 기록, 0, 분수 이닝을 구분한다", () => {
  assert.equal(formatStat("pit_outs", 19), "6⅓");
  assert.equal(formatStat("bat_avg", "0"), ".000");
  assert.equal(formatStat("bat_avg", 0), ".000");
  assert.equal(formatStat("pit_era", ""), "—");
  assert.equal(formatStat("pit_era", null), "—");
  assert.deepEqual(
    sortRecords([{ v: "" }, { v: "0" }, { v: "2" }], "v", true).map((r) => r.v),
    ["0", "2", ""],
  );
  assert.equal(shiftDate("2025-01-01", -1), "2024-12-31");
  assert.equal(safeLink("javascript:alert(1)"), "");
});

test("API 응답을 화면용 행으로 바꾼다", () => {
  const g = toGame({
    id: 7,
    kboGameId: "20250601_OBWO0",
    season: 2025,
    matchDate: "2025-06-01",
    matchTime: "14:00:00",
    homeTeam: { code: "WO" },
    awayTeam: { code: "OB" },
    homeScore: 1,
    awayScore: 0,
    status: "FINISHED",
    actions: { ticketUrl: null, highlightUrl: "https://youtu.be/a" },
  });
  assert.equal(g.match_time, "14:00");
  assert.equal(g.home_team_code, "WO");
  assert.equal(g.ticket_url, "");
  // 동명이인이라 선수 확인이 안 된 기록은 링크하지 않도록 player_id 를 비운다
  const b = toBatterGame({ playerName: "김민석", player: null, ab: 4, ops: 0.2 });
  assert.equal(b.player_id, "");
  assert.equal(b.at_bats, 4);
});

test("팀·시즌 목록은 DB에서 받는다", () => {
  assert.equal(state.db.teams.length, 10);
  assert.ok(state.db.team.get("HT").id);
  assert.deepEqual(state.db.seasons, ["2026", "2025", "2024"]);
});

test("홈: 6월 1일 5경기와 일별 선수 기록, 미수집 날짜 안내", async () => {
  route("home");
  const html = await home();
  assert.equal((html.match(/class="game-card"/g) || []).length, 5);
  assert.match(html, /78개 출전 기록/);
  assert.ok(requested.includes("/api/matches/player-records?date=2025-06-01"));
  route("home", "date=2025-06-03");
  assert.match(await home(), /아직 수집되지 않았습니다/);
});

test("경기 상세: 이닝표(9회말 X), 주요 기록, 출전 선수, 없는 경기", async () => {
  route("game", "id=1116");
  const html = await gamePage();
  assert.match(html, /이닝별 득점/);
  assert.match(html, /<td>X<\/td>/);
  assert.match(html, /결승타/);
  assert.match(html, /김재현/);
  route("game", "id=999999");
  assert.match(await gamePage(), /경기를 찾을 수 없습니다/);
});

test("선수 기록: 필터·정렬·페이지는 서버에 넘긴다", async () => {
  route("players", "season=2025&q=김도영");
  assert.match(await playerPage(), /김도영/);
  assert.ok(
    requested.some(
      (u) =>
        u.startsWith("/api/records/batters?") &&
        u.includes("keyword=%EA%B9%80%EB%8F%84%EC%98%81") &&
        u.includes("sort=avg") &&
        u.includes("order=desc"),
    ),
  );
  route("players", "season=2025&type=pit&min=100");
  const html = await playerPage();
  assert.match(html, /폰세/);
  assert.ok(requested.some((u) => u.includes("minInnings=100")));
});

test("선수 상세와 팀 순위, 선수 비교", async () => {
  route("player", "id=264&type=bat&season=2025");
  assert.match(await playerDetail(), /디아즈/);
  route("teams", "season=2024");
  assert.match(await teamPage(), /2024.10.31/);
  route("compare", "type=pit");
  const html = await comparePage();
  assert.match(html, /원태인/);
  assert.match(html, /김택연/);
  assert.ok(requested.some((u) => u.startsWith("/api/records/pitchers/compare?")));
});

test("같은 주소는 한 번만 요청한다", async () => {
  clearCache();
  route("teams", "season=2025");
  await teamPage();
  await teamPage();
  assert.equal(
    requested.filter((u) => u === "/api/standings?season=2025").length,
    1,
  );
});
