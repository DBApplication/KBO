import { queryOptions } from "@tanstack/react-query";
import { ENDPOINTS } from "@/constants";
import { getJSON, orNullOn404 } from "@/lib";
import type { BatterSortKey, ComparisonItem, Kind, PageResponse, PitcherSortKey, RankingItem, SeasonRecord, StatsOf } from "@/types";

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

/** GET /api/records/seasons — 선수 기록이 있는 시즌 (최신순) */
export const fetchRecordSeasons = () => getJSON<number[]>(ENDPOINTS.RECORD_SEASONS);

/** GET /api/records/batters · /pitchers — 필터·정렬·페이지는 서버(SQL)에서 */
export function fetchRanking<K extends Kind>(kind: K, params: RankingParams) {
  return getJSON<PageResponse<RankingItem<StatsOf<K>>>>(
    kind === "pit" ? ENDPOINTS.PITCHERS : ENDPOINTS.BATTERS,
    { ...params },
  );
}

/** GET /api/players/{id}/records/batter · /pitcher — 연도별 시즌 기록 */
export function fetchPlayerHistory<K extends Kind>(kind: K, id: string | number) {
  return getJSON<SeasonRecord<StatsOf<K>>[]>(
    kind === "pit" ? ENDPOINTS.PLAYER_PITCHER_RECORDS(id) : ENDPOINTS.PLAYER_BATTER_RECORDS(id),
  );
}

/** GET /api/records/batters/compare · /pitchers/compare — 한쪽이라도 그 시즌 기록이 없으면(R001) null */
export function fetchComparison<K extends Kind>(kind: K, season: string | number, ids: [number, number]) {
  return orNullOn404(
    getJSON<[ComparisonItem<StatsOf<K>>, ComparisonItem<StatsOf<K>>]>(
      kind === "pit" ? ENDPOINTS.PITCHERS_COMPARE : ENDPOINTS.BATTERS_COMPARE,
      { season, playerIds: ids.join(",") },
    ),
  );
}

export const recordSeasonsQuery = () =>
  queryOptions({ queryKey: ["records", "seasons"], queryFn: fetchRecordSeasons, staleTime: Infinity });

export const rankingQuery = <K extends Kind>(kind: K, params: RankingParams) =>
  queryOptions({ queryKey: ["ranking", kind, params], queryFn: () => fetchRanking(kind, params) });

/** 비교 후보: 그 시즌 기록이 있는 선수를 이름순으로 최대 100명 */
export const choicesQuery = <K extends Kind>(kind: K, season: string, keyword = "") =>
  rankingQuery(kind, { season, keyword: keyword.trim(), sort: "name", order: "asc", size: 100, page: 0 });

export const playerHistoryQuery = <K extends Kind>(kind: K, id: string) =>
  queryOptions({ queryKey: ["player", id, "history", kind], queryFn: () => fetchPlayerHistory(kind, id) });

export const comparisonQuery = <K extends Kind>(kind: K, season: string, ids: [number, number]) =>
  queryOptions({ queryKey: ["comparison", kind, season, ids], queryFn: () => fetchComparison(kind, season, ids) });
