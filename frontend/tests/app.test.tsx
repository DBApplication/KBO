import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import { AxiosError } from "axios";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { RouterProvider, createMemoryRouter } from "react-router";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { fetchMatch } from "@/api";
import { ENDPOINTS } from "@/constants";
import { standingsQuery } from "@/features/standing";
import { ApiError, apiClient, createQueryClient, serializeParams } from "@/lib";
import { createRoutes } from "@/router";
import { formatStat, safeLink, shiftDate, sortBy } from "@/utils";

/*
 * 화면 테스트는 백엔드 API 응답을 녹화한 파일(tests/fixtures/api.json)로 돈다.
 * 백엔드에 실제 데이터를 넣고 서버를 켠 상태에서 아래처럼 실행하면 응답을 다시 녹화한다.
 *   KBO_RECORD_API=http://localhost:8080 pnpm test
 */
// jsdom 환경에서는 import.meta.url 이 file: 주소가 아니어서 프로젝트 폴더 기준 경로를 쓴다.
const FIXTURE = resolve(process.cwd(), "tests/fixtures/api.json");
const recordFrom = process.env.KBO_RECORD_API;
type Saved = { status: number; body: unknown };
const fixtures: Record<string, Saved> = recordFrom ? {} : JSON.parse(readFileSync(FIXTURE, "utf8"));
const requested: string[] = [];
// axios 요청을 실제 네트워크 대신 녹화 파일에서 응답한다 (키: /api/...?쿼리, 운영과 같은 쿼리 직렬화).
apiClient.defaults.adapter = async (config) => {
  const url = apiClient.getUri(config);
  requested.push(url);
  if (recordFrom) {
    const res = await fetch(recordFrom + url);
    fixtures[url] = { status: res.status, body: await res.json() };
  }
  const saved = fixtures[url];
  if (!saved) throw new Error("녹화된 응답이 없습니다: " + url);
  const response = { data: saved.body, status: saved.status, statusText: "", headers: {}, config };
  if (saved.status >= 200 && saved.status < 300) return response;
  throw new AxiosError("HTTP " + saved.status, AxiosError.ERR_BAD_RESPONSE, config, null, response);
};
afterAll(() => {
  if (recordFrom) {
    const sorted = Object.fromEntries(Object.entries(fixtures).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(FIXTURE, JSON.stringify(sorted, null, 1) + "\n");
  }
});

// 테스트마다 새 캐시로 시작해 앞 테스트의 응답이 요청 기록에 영향을 주지 않게 한다.
let qc: QueryClient;
beforeEach(() => {
  qc = createQueryClient();
  requested.length = 0;
});

/** 주소(예: "/players?season=2025")의 화면을 그리고, 로더가 끝나 본문이 나올 때까지 기다린다. */
async function open(path: string, waitFor: string | RegExp): Promise<HTMLElement> {
  const router = createMemoryRouter(createRoutes(qc), { initialEntries: [path] });
  render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await screen.findAllByText(waitFor, {}, { timeout: 8000 });
  return document.querySelector("main")!;
}

/** 한 테스트 안에서 다른 화면을 새로 그릴 때 이전 화면과 요청 기록을 지운다. */
function reset() {
  cleanup();
  requested.length = 0;
}

describe("기록 계산", () => {
  test("빈 기록, 0, 분수 이닝을 구분한다", () => {
    expect(formatStat(19, "outs")).toBe("6⅓");
    expect(formatStat("0", "rate")).toBe(".000");
    expect(formatStat(0, "rate")).toBe(".000");
    expect(formatStat(2.249, "era")).toBe("2.25");
    expect(formatStat("", "era")).toBe("—");
    expect(formatStat(null, "era")).toBe("—");
    expect(formatStat(0)).toBe("0");
    expect(sortBy([{ v: "" }, { v: "0" }, { v: "2" }], (r) => r.v, true).map((r) => r.v)).toEqual([
      "0",
      "2",
      "",
    ]);
    expect(shiftDate("2025-01-01", -1)).toBe("2024-12-31");
    expect(safeLink("javascript:alert(1)")).toBe("");
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

  test("팀 순위의 시즌 선택기는 순위가 있는 시즌 목록을 쓴다", async () => {
    await open("/teams?season=2024", /2024\.10\.31/);
    const select = screen.getByLabelText("시즌") as HTMLSelectElement;
    const seasons = within(select).getAllByRole<HTMLOptionElement>("option");
    expect(seasons.map((o) => o.value)).toEqual(["2026", "2025", "2024"]);
  });

  test("경기 목록: 그 주의 경기 없는 날을 표시한다", async () => {
    const main = await open("/games?date=2025-06-01", "5경기");
    expect(requested).toContain("/api/matches/dates?from=2025-05-26&to=2025-06-01");
    // 6월 2일(월)은 KBO 휴식일
    expect(main.querySelectorAll(".week a.no-games").length).toBeGreaterThan(0);
  });

  test("경기 상세: 이닝표(9회말 X), 주요 기록, 출전 선수", async () => {
    const main = await open("/game?id=1116", "이닝별 기록");
    expect(main.querySelector("caption")?.textContent).toBe("이닝별 득점");
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
    reset();
    await open("/players?season=2025&type=pit", "규정이닝 이상 (144이닝)");
    expect(requested.some((u) => u.includes("minInnings=144") && u.includes("sort=era"))).toBe(true);
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
    reset();
    await open("/players?season=2025&type=pit&min=100&team=HT", "네일");
    expect(requested.some((u) => u.includes("minInnings=100") && u.includes("teamId="))).toBe(true);
  });

  test("선수 상세", async () => {
    await open("/player?id=264&type=bat&season=2025", "디아즈");
  });

  test("선수 비교: 기본 투수 쌍", async () => {
    await open("/compare?type=pit", "원태인");
    expect(screen.getAllByText("김택연").length).toBeGreaterThan(0);
    expect(requested.some((u) => u.startsWith("/api/records/pitchers/compare?"))).toBe(true);
  });

  test("검색: 선수와 팀", async () => {
    await open("/search?q=KIA", "KIA 타이거즈");
  });
});

test("같은 쿼리는 캐시에서 읽고 한 번만 요청한다", async () => {
  await qc.ensureQueryData(standingsQuery("2025"));
  await qc.ensureQueryData(standingsQuery("2025"));
  expect(requested.filter((u) => u === "/api/standings?season=2025")).toHaveLength(1);
});

describe("API 클라이언트 (axios)", () => {
  test("빈 조건은 쿼리에서 빼고 백엔드 순서대로 붙인다", () => {
    expect(serializeParams({ date: "2025-06-01", teamId: "", status: undefined })).toBe("date=2025-06-01");
    expect(apiClient.getUri({ url: ENDPOINTS.MATCHES, params: { date: "2025-06-01", teamId: 7 } })).toBe(
      "/api/matches?date=2025-06-01&teamId=7",
    );
  });

  test("실패 응답은 백엔드 ErrorResponse 의 코드를 담은 ApiError 로 바뀐다", async () => {
    const error = await fetchMatch(999999).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 404, code: "M001" });
  });
});
