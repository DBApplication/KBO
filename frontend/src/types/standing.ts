import type { IsoDate } from "./api";
import type { TeamSummary } from "./team";

/** record/dto/StandingsResponse */
export interface Standings {
  season: number;
  /** 순위 기준일 */
  asOfDate: IsoDate;
  standings: StandingRow[];
}

/** record/dto/StandingsResponse.Row */
export interface StandingRow {
  rank: number;
  team: TeamSummary;
  games: number | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  winPct: number | null;
  gamesBehind: number | null;
  /** 예: 6승1무3패 */
  last10: string | null;
  /** 예: 2승 */
  streak: string | null;
}
