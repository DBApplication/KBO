import type { BatterGameRecord, Column, GameRecord, Kind, PitcherGameRecord } from "@/types";

/** 경기별 타자 기록 열 (홈·일별·경기 상세) */
export const batterGameColumns: Column<BatterGameRecord>[] = [
  { key: "ab", label: "타수", get: (r) => r.ab },
  { key: "hits", label: "안타", get: (r) => r.hits },
  { key: "homeRuns", label: "홈런", get: (r) => r.homeRuns },
  { key: "rbi", label: "타점", get: (r) => r.rbi },
  { key: "runs", label: "득점", get: (r) => r.runs },
  { key: "ops", label: "OPS", get: (r) => r.ops, format: "rate" },
];

/** 경기별 투수 기록 열 */
export const pitcherGameColumns: Column<PitcherGameRecord>[] = [
  { key: "outs", label: "이닝", get: (r) => r.outs, format: "outs" },
  { key: "strikeouts", label: "탈삼진", get: (r) => r.strikeouts },
  { key: "hitsAllowed", label: "피안타", get: (r) => r.hitsAllowed },
  { key: "earnedRuns", label: "자책", get: (r) => r.earnedRuns },
  { key: "pitches", label: "투구 수", get: (r) => r.pitches },
  { key: "era", label: "ERA", get: (r) => r.era, format: "era" },
];

/**
 * kind 로 고른 경기 기록 열. 열의 get 은 자기 종류의 기록만 받지만,
 * 화면은 같은 kind 의 기록만 넘기므로 공통 타입으로 넓혀 쓴다.
 */
export function gameColumns(kind: Kind) {
  return (kind === "pit" ? pitcherGameColumns : batterGameColumns) as unknown as Column<GameRecord>[];
}
