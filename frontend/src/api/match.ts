import { ENDPOINTS } from "@/constants";
import { get } from "@/lib";
import type { DailyPlayerRecords, IsoDate, MatchDetail, MatchSummary } from "@/types";

export interface MatchFilter {
  teamId?: number | "";
  /** SCHEDULED | IN_PROGRESS | FINISHED | CANCELED */
  status?: string;
}

/** GET /api/matches?date=&teamId=&status= — 날짜별 경기 목록 */
export const fetchMatches = (date: IsoDate, { teamId, status }: MatchFilter = {}) =>
  get<MatchSummary[]>(ENDPOINTS.MATCHES, { date, teamId, status });

/** GET /api/matches/dates?from=&to=&teamId= — 기간 안에 경기가 있는 날짜 */
export const fetchMatchDates = (from: IsoDate, to: IsoDate, teamId?: number | "") =>
  get<IsoDate[]>(ENDPOINTS.MATCH_DATES, { from, to, teamId });

/** GET /api/matches/{id} — 점수판·하이라이트·주요 기록·출전 선수 */
export const fetchMatch = (id: string | number) => get<MatchDetail>(ENDPOINTS.MATCH(id));

/** GET /api/matches/player-records?date= — 그 날 모든 경기의 선수별 기록 */
export const fetchDailyRecords = (date: IsoDate) =>
  get<DailyPlayerRecords>(ENDPOINTS.DAILY_PLAYER_RECORDS, { date });
