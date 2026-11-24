import { queryOptions } from "@tanstack/react-query";
import { getJSON, type IsoDate } from "@/shared/api";
import type { DailyPlayerRecords, MatchDetail, MatchSummary } from "../model/types";

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
