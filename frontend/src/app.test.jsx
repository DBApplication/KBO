import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { formatStat, sortRecords, shiftDate, safeLink } from "./lib/records.js";
import { clearCache, standings, toBatterGame, toGame } from "./lib/api.js";
import { routes } from "./routes.jsx";

/*
 * 화면 테스트는 백엔드 API 응답을 녹화한 파일(test-fixtures/api.json)로 돈다.
 * 백엔드에 실제 데이터를 넣고 서버를 켠 상태에서 아래처럼 실행하면 응답을 다시 녹화한다.
 *   KBO_RECORD_API=http://localhost:8080 pnpm test
 */
// jsdom 환경에서는 import.meta.url 이 file: 주소가 아니어서 프로젝트 폴더 기준 경로를 쓴다.
const FIXTURE = resolve(process.cwd(), "src/test-fixtures/api.json");
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
afterAll(() => {
  if (recordFrom) writeFileSync(FIXTURE, JSON.stringify(fixtures, null, 1));
});
// 요청 기록을 보는 테스트가 앞 테스트의 캐시에 영향을 받지 않도록 매번 비운다.
beforeEach(() => {
  clearCache();
  requested.length = 0;
});

/** 주소(예: "/players?season=2025")의 화면을 그리고, 로더가 끝나 본문이 나올 때까지 기다린다. */
async function open(path, waitFor) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  await screen.findAllByText(waitFor, {}, { timeout: 8000 });
  return document.querySelector("main");
}

describe("기록 계산", () => {
  test("빈 기록, 0, 분수 이닝을 구분한다", () => {
    expect(formatStat("pit_outs", 19)).toBe("6⅓");
    expect(formatStat("bat_avg", "0")).toBe(".000");
    expect(formatStat("bat_avg", 0)).toBe(".000");
    expect(formatStat("pit_era", "")).toBe("—");
    expect(formatStat("pit_era", null)).toBe("—");
    expect(
      sortRecords([{ v: "" }, { v: "0" }, { v: "2" }], "v", true).map((r) => r.v),
    ).toEqual(["0", "2", ""]);
    expect(shiftDate("2025-01-01", -1)).toBe("2024-12-31");
    expect(safeLink("javascript:alert(1)")).toBe("");
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
    expect(g.match_time).toBe("14:00");
    expect(g.home_team_code).toBe("WO");
    expect(g.ticket_url).toBe("");
    // 동명이인이라 선수 확인이 안 된 기록은 링크하지 않도록 player_id 를 비운다
    const b = toBatterGame({ playerName: "김민석", player: null, ab: 4, ops: 0.2 });
    expect(b.player_id).toBe("");
    expect(b.at_bats).toBe(4);
  });
});

describe("화면", () => {
  test("홈: 6월 1일 5경기와 일별 선수 기록", async () => {
    const main = await open("/", /78개 출전 기록/);
    expect(main.querySelectorAll(".game-card")).toHaveLength(5);
    expect(requested).toContain("/api/matches/player-records?date=2025-06-01");
    expect(document.title).toBe("홈 · DIAMOND / KBO");
  });

  test("홈: 기록이 없는 날은 미수집 안내", async () => {
    await open("/home?date=2025-06-03", /아직 수집되지 않았습니다/);
  });

  test("팀·시즌 목록은 DB에서 받아 시즌 선택기에 쓴다", async () => {
    await open("/teams?season=2024", /2024\.10\.31/);
    const seasons = within(screen.getByLabelText("시즌")).getAllByRole("option");
    expect(seasons.map((o) => o.value)).toEqual(["2026", "2025", "2024"]);
  });

  test("경기 상세: 이닝표(9회말 X), 주요 기록, 출전 선수", async () => {
    const main = await open("/game?id=1116", "이닝별 기록");
    expect(main.querySelector('caption')?.textContent).toBe("이닝별 득점");
    expect([...main.querySelectorAll("td")].some((td) => td.textContent === "X")).toBe(true);
    expect(main.textContent).toMatch(/결승타/);
    expect(main.textContent).toMatch(/김재현/);
  });

  test("경기 상세: 없는 경기", async () => {
    await open("/game?id=999999", "경기를 찾을 수 없습니다.");
  });

  test("선수 기록: 처음에는 KBO 기록실처럼 규정타석·규정이닝 이상", async () => {
    await open("/players?season=2025", "규정타석 이상 (446타석)");
    expect(requested.some((u) => u.includes("minPa=446") && u.includes("sort=avg"))).toBe(true);
    cleanupAndReset();
    await open("/players?season=2025&type=pit", "규정이닝 이상 (144이닝)");
    expect(requested.some((u) => u.includes("minInnings=144") && u.includes("sort=era"))).toBe(
      true,
    );
  });

  test("선수 기록: 필터·정렬·페이지는 서버에 넘긴다", async () => {
    await open("/players?season=2025&q=김도영", "김도영");
    expect(
      requested.some(
        (u) =>
          u.startsWith("/api/records/batters?") &&
          u.includes("keyword=%EA%B9%80%EB%8F%84%EC%98%81") &&
          u.includes("sort=avg") &&
          u.includes("order=desc"),
      ),
    ).toBe(true);
    cleanupAndReset();
    await open("/players?season=2025&type=pit&min=100", "폰세");
    expect(requested.some((u) => u.includes("minInnings=100"))).toBe(true);
  });

  test("선수 상세", async () => {
    await open("/player?id=264&type=bat&season=2025", "디아즈");
  });

  test("선수 비교: 기본 투수 쌍", async () => {
    await open("/compare?type=pit", "원태인");
    expect(screen.getAllByText("김택연").length).toBeGreaterThan(0);
    expect(requested.some((u) => u.startsWith("/api/records/pitchers/compare?"))).toBe(true);
  });
});

test("같은 주소는 한 번만 요청한다", async () => {
  clearCache();
  requested.length = 0;
  await standings("2025");
  await standings("2025");
  expect(requested.filter((u) => u === "/api/standings?season=2025")).toHaveLength(1);
});

/** 한 테스트 안에서 다른 화면을 새로 그릴 때 이전 화면과 요청 기록을 지운다. */
function cleanupAndReset() {
  cleanup();
  requested.length = 0;
}
