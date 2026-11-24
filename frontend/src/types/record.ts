import type { Kind } from "./common";
import type { PlayerDetail, PlayerSummary } from "./player";
import type { TeamSummary } from "./team";

/** record/dto/BatterStats */
export interface BatterStats {
  avg: number | null;
  games: number | null;
  pa: number | null;
  ab: number | null;
  runs: number | null;
  hits: number | null;
  doubles: number | null;
  triples: number | null;
  homeRuns: number | null;
  totalBases: number | null;
  rbi: number | null;
  stolenBases: number | null;
  caughtStealing: number | null;
  walks: number | null;
  hitByPitch: number | null;
  strikeouts: number | null;
  gdp: number | null;
  slg: number | null;
  obp: number | null;
  errors: number | null;
  ops: number | null;
}

/** record/dto/PitcherStats */
export interface PitcherStats {
  era: number | null;
  games: number | null;
  completeGames: number | null;
  shutouts: number | null;
  wins: number | null;
  losses: number | null;
  saves: number | null;
  holds: number | null;
  winPct: number | null;
  battersFaced: number | null;
  /** 아웃 수 (이닝 × 3). 정렬 키는 innings */
  outs: number | null;
  /** 이닝 표기 (예: "6 1/3") */
  innings: string | null;
  hits: number | null;
  homeRuns: number | null;
  walks: number | null;
  hitByPitch: number | null;
  strikeouts: number | null;
  runs: number | null;
  earnedRuns: number | null;
}

/** kind 에 맞는 시즌 기록 타입 */
export type StatsOf<K extends Kind> = K extends "bat" ? BatterStats : PitcherStats;
export type SeasonStats = BatterStats | PitcherStats;

/** record/dto/BatterRankingItem · PitcherRankingItem */
export interface RankingItem<S> {
  rank: number;
  player: PlayerSummary;
  /** 그 시즌 소속 팀 */
  team: TeamSummary | null;
  stats: S;
}

/** record/dto/BatterSeasonResponse · PitcherSeasonResponse (선수 상세의 연도별 기록) */
export interface SeasonRecord<S> {
  season: number;
  team: TeamSummary | null;
  stats: S;
}

/** record/dto/BatterComparisonItem · PitcherComparisonItem */
export interface ComparisonItem<S> {
  player: PlayerDetail;
  team: TeamSummary | null;
  season: number;
  stats: S;
}

/** RecordController 의 정렬 키 (BatterRecordService.SORTABLE) */
export type BatterSortKey = keyof BatterStats | "name" | "team";
/** RecordController 의 정렬 키 (PitcherRecordService.SORTABLE). 이닝 정렬은 outs 가 아니라 innings */
export type PitcherSortKey = Exclude<keyof PitcherStats, "outs" | "innings"> | "innings" | "name" | "team";
