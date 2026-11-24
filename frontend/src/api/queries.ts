/**
 * TanStack Query 옵션 (키 + 조회 함수). 라우터 로더는 ensureQueryData 로 미리 받고,
 * 화면 컴포넌트는 같은 옵션으로 useSuspenseQuery 를 불러 캐시에서 바로 읽는다.
 */
import { QueryClient, queryOptions } from "@tanstack/react-query";
import {
  ApiError,
  fetchComparison,
  fetchDailyRecords,
  fetchMatch,
  fetchMatchDates,
  fetchMatches,
  fetchPlayer,
  fetchPlayerHistory,
  fetchPlayers,
  fetchRanking,
  fetchRecordSeasons,
  fetchStandingSeasons,
  fetchStandings,
  fetchTeams,
  type MatchFilter,
  type PlayerSearchParams,
  type RankingParams,
} from "./client.ts";
import type { IsoDate, Kind } from "./types.ts";

/** 기록은 조회만 하는 데이터라 한 번 받으면 오래 쓴다. 4xx 는 다시 시도해도 같으므로 재시도하지 않는다. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        retry: (count, error) =>
          !(error instanceof ApiError && error.status < 500) && count < 2,
      },
    },
  });
}

export const teamsQuery = () =>
  queryOptions({ queryKey: ["teams"], queryFn: fetchTeams, staleTime: Infinity });

/** 주소의 팀 코드(team=HT) → API 의 teamId. 코드가 비었거나 모르는 코드면 "" (전체 팀). */
export async function teamIdOf(qc: QueryClient, code: string): Promise<number | ""> {
  if (!code) return "";
  const teams = await qc.ensureQueryData(teamsQuery());
  return teams.find((t) => t.code === code)?.id ?? "";
}

export const standingSeasonsQuery = () =>
  queryOptions({
    queryKey: ["standings", "seasons"],
    queryFn: fetchStandingSeasons,
    staleTime: Infinity,
  });

export const standingsQuery = (season: string) =>
  queryOptions({ queryKey: ["standings", season], queryFn: () => fetchStandings(season) });

export const recordSeasonsQuery = () =>
  queryOptions({ queryKey: ["records", "seasons"], queryFn: fetchRecordSeasons, staleTime: Infinity });

export const matchesQuery = (date: IsoDate, filter: MatchFilter = {}) =>
  queryOptions({
    queryKey: ["matches", date, filter.teamId || "", filter.status || ""],
    queryFn: () => fetchMatches(date, filter),
  });

export const matchDatesQuery = (from: IsoDate, to: IsoDate, teamId?: number | "") =>
  queryOptions({
    queryKey: ["matches", "dates", from, to, teamId || ""],
    queryFn: () => fetchMatchDates(from, to, teamId),
  });

export const matchQuery = (id: string) =>
  queryOptions({ queryKey: ["match", id], queryFn: () => fetchMatch(id) });

export const dailyRecordsQuery = (date: IsoDate) =>
  queryOptions({ queryKey: ["daily-records", date], queryFn: () => fetchDailyRecords(date) });

export const playersQuery = (params: PlayerSearchParams) =>
  queryOptions({ queryKey: ["players", params], queryFn: () => fetchPlayers(params) });

export const playerQuery = (id: string) =>
  queryOptions({ queryKey: ["player", id], queryFn: () => fetchPlayer(id) });

export const playerHistoryQuery = <K extends Kind>(kind: K, id: string) =>
  queryOptions({
    queryKey: ["player", id, "history", kind],
    queryFn: () => fetchPlayerHistory(kind, id),
  });

export const rankingQuery = <K extends Kind>(kind: K, params: RankingParams) =>
  queryOptions({ queryKey: ["ranking", kind, params], queryFn: () => fetchRanking(kind, params) });

/** 비교 후보: 그 시즌 기록이 있는 선수를 이름순으로 최대 100명 */
export const choicesQuery = <K extends Kind>(kind: K, season: string, keyword = "") =>
  rankingQuery(kind, {
    season,
    keyword: keyword.trim(),
    sort: "name",
    order: "asc",
    size: 100,
    page: 0,
  });

export const comparisonQuery = <K extends Kind>(kind: K, season: string, ids: [number, number]) =>
  queryOptions({
    queryKey: ["comparison", kind, season, ids],
    queryFn: () => fetchComparison(kind, season, ids),
  });
