import { queryOptions } from "@tanstack/react-query";
import { fetchComparison, fetchPlayerHistory, fetchRanking, fetchRecordSeasons, type RankingParams } from "@/api";
import type { Kind } from "@/types";

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
