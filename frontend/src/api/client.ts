/**
 * 백엔드(Spring Boot) 조회 API 호출. 엔드포인트마다 함수 하나, 응답은 백엔드 DTO 타입 그대로 돌려준다.
 * 개발 서버(pnpm dev)와 미리보기(pnpm preview)는 /api 를 localhost:8080 으로 넘긴다 (vite.config.ts).
 * 캐시·중복 요청 제거는 TanStack Query 가 맡는다 (queries.ts).
 */
import type {
  BatterSortKey,
  ComparisonItem,
  DailyPlayerRecords,
  ErrorResponse,
  IsoDate,
  Kind,
  MatchDetail,
  MatchSummary,
  PageResponse,
  PitcherSortKey,
  PlayerDetail,
  PlayerSearchItem,
  PlayerType,
  RankingItem,
  SeasonRecord,
  Standings,
  StatsOf,
  TeamSummary,
} from "./types.ts";

/** API 오류. HTTP 상태와 서버 오류 코드(ErrorCode, 예: M001)를 함께 담는다. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  constructor(status: number, code?: string, message?: string) {
    super(message || "API 오류 " + status);
    this.status = status;
    this.code = code;
  }
}

/** 400(잘못된 id 형식)·404(없는 자원)는 화면에서 "찾을 수 없음"으로 보여 준다. */
export function isNotFound(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 400 || e.status === 404);
}

type Params = Record<string, string | number | null | undefined>;

/** 빈 값은 빼고 쿼리 문자열을 만든다. */
function query(params: Params = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") q.set(k, String(v));
  return q.size ? "?" + q : "";
}

/** GET /api 요청을 보내고 JSON 을 돌려준다. 실패하면 ApiError 를 던진다. */
export async function getJSON<T>(path: string, params?: Params): Promise<T> {
  const res = await fetch("/api" + path + query(params), {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body as Partial<ErrorResponse> | null;
    throw new ApiError(res.status, err?.code, err?.message);
  }
  return body as T;
}

// ------------------------------------------------------------------ 팀 · 순위

/** GET /api/teams */
export const fetchTeams = () => getJSON<TeamSummary[]>("/teams");

/** GET /api/standings/seasons — 순위 기록이 있는 시즌 (최신순) */
export const fetchStandingSeasons = () => getJSON<number[]>("/standings/seasons");

/** GET /api/standings?season= — 그 시즌 순위가 없으면(R002) null */
export async function fetchStandings(season: string | number): Promise<Standings | null> {
  try {
    return await getJSON<Standings>("/standings", { season });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// ------------------------------------------------------------------ 경기

export interface MatchFilter {
  teamId?: number | "";
  status?: string;
}

/** GET /api/matches?date=&teamId=&status= */
export const fetchMatches = (date: IsoDate, { teamId, status }: MatchFilter = {}) =>
  getJSON<MatchSummary[]>("/matches", { date, teamId, status });

/** GET /api/matches/dates?from=&to=&teamId= — 기간 안에 경기가 있는 날짜 */
export const fetchMatchDates = (from: IsoDate, to: IsoDate, teamId?: number | "") =>
  getJSON<IsoDate[]>("/matches/dates", { from, to, teamId });

/** GET /api/matches/{id} — 점수판·하이라이트·주요 기록·출전 선수 */
export const fetchMatch = (id: string | number) =>
  getJSON<MatchDetail>("/matches/" + encodeURIComponent(id));

/** GET /api/matches/player-records?date= — 그 날 모든 경기의 선수별 기록 */
export const fetchDailyRecords = (date: IsoDate) =>
  getJSON<DailyPlayerRecords>("/matches/player-records", { date });

// ------------------------------------------------------------------ 선수

export interface PlayerSearchParams {
  keyword?: string;
  teamId?: number | "";
  type?: PlayerType;
  page?: number;
  size?: number;
}

/** GET /api/players?keyword=&teamId=&type=&page=&size= */
export const fetchPlayers = (params: PlayerSearchParams) =>
  getJSON<PageResponse<PlayerSearchItem>>("/players", { ...params });

/** GET /api/players/{id} */
export const fetchPlayer = (id: string | number) =>
  getJSON<PlayerDetail>("/players/" + encodeURIComponent(id));

/** GET /api/players/{id}/records/batter · /pitcher — 연도별 시즌 기록 */
export function fetchPlayerHistory<K extends Kind>(kind: K, id: string | number) {
  return getJSON<SeasonRecord<StatsOf<K>>[]>(
    `/players/${encodeURIComponent(id)}/records/${kind === "pit" ? "pitcher" : "batter"}`,
  );
}

// ------------------------------------------------------------------ 시즌 기록

/** GET /api/records/seasons — 선수 기록이 있는 시즌 */
export const fetchRecordSeasons = () => getJSON<number[]>("/records/seasons");

export interface RankingParams {
  season: string | number;
  teamId?: number | "";
  keyword?: string;
  /** 타자: 최소 타석 */
  minPa?: number | "";
  /** 투수: 최소 이닝 */
  minInnings?: number | "";
  sort?: BatterSortKey | PitcherSortKey;
  order?: "asc" | "desc";
  /** 0부터 */
  page?: number;
  /** 최대 100 */
  size?: number;
}

/** GET /api/records/batters · /pitchers — 필터·정렬·페이지는 서버(SQL)에서 */
export function fetchRanking<K extends Kind>(kind: K, params: RankingParams) {
  return getJSON<PageResponse<RankingItem<StatsOf<K>>>>(
    kind === "pit" ? "/records/pitchers" : "/records/batters",
    { ...params },
  );
}

/** GET /api/records/batters/compare · /pitchers/compare — 한쪽이라도 그 시즌 기록이 없으면(R001) null */
export async function fetchComparison<K extends Kind>(
  kind: K,
  season: string | number,
  ids: [number, number],
): Promise<[ComparisonItem<StatsOf<K>>, ComparisonItem<StatsOf<K>>] | null> {
  try {
    return await getJSON(kind === "pit" ? "/records/pitchers/compare" : "/records/batters/compare", {
      season,
      playerIds: ids.join(","),
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
