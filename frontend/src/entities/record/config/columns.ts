/** 시즌 기록표 열 정의: 표 머리글, 값을 꺼내는 함수, 표시 형식, 서버 정렬 키. */
import type { Kind } from "@/shared/config";
import type { Column, StatFormat } from "@/shared/lib";
import type { BatterSortKey, BatterStats, PitcherSortKey, PitcherStats, SeasonStats } from "../model/types";

const bat = (key: keyof BatterStats, label: string, format?: StatFormat): Column<BatterStats, BatterSortKey> => ({
  key,
  label,
  get: (s) => s[key],
  format,
});

const pit = (
  key: PitcherSortKey,
  label: string,
  get: (s: PitcherStats) => number | string | null,
  format?: StatFormat,
): Column<PitcherStats, PitcherSortKey> => ({ key, label, get, format });

/** 선수 기록 목록 */
const batterList = [
  bat("games", "경기"),
  bat("ab", "타수"),
  bat("hits", "안타"),
  bat("homeRuns", "홈런"),
  bat("rbi", "타점"),
  bat("runs", "득점"),
  bat("avg", "타율", "rate"),
  bat("obp", "출루율", "rate"),
  bat("slg", "장타율", "rate"),
  bat("ops", "OPS", "rate"),
];
const pitcherList = [
  pit("games", "경기", (s) => s.games),
  // 이닝은 아웃 수로 표시하고, 서버 정렬 키는 innings
  pit("innings", "이닝", (s) => s.outs, "outs"),
  pit("wins", "승", (s) => s.wins),
  pit("losses", "패", (s) => s.losses),
  pit("saves", "세이브", (s) => s.saves),
  pit("holds", "홀드", (s) => s.holds),
  pit("strikeouts", "탈삼진", (s) => s.strikeouts),
  pit("walks", "볼넷", (s) => s.walks),
  pit("hits", "피안타", (s) => s.hits),
  pit("earnedRuns", "자책", (s) => s.earnedRuns),
  pit("era", "ERA", (s) => s.era, "era"),
];

/** 선수 비교 (투수는 목록과 같다) */
const batterCompare = [
  bat("games", "경기"),
  bat("pa", "타석"),
  bat("avg", "타율", "rate"),
  bat("hits", "안타"),
  bat("homeRuns", "홈런"),
  bat("rbi", "타점"),
  bat("runs", "득점"),
  bat("stolenBases", "도루"),
  bat("obp", "출루율", "rate"),
  bat("slg", "장타율", "rate"),
  bat("ops", "OPS", "rate"),
];

/** 선수 상세 연도별 기록 (KBO 기록실 약어) */
const batterHistory = [
  bat("avg", "AVG", "rate"),
  bat("games", "G"),
  bat("pa", "PA"),
  bat("ab", "AB"),
  bat("runs", "R"),
  bat("hits", "H"),
  bat("doubles", "2B"),
  bat("triples", "3B"),
  bat("homeRuns", "HR"),
  bat("totalBases", "TB"),
  bat("rbi", "RBI"),
  bat("stolenBases", "SB"),
  bat("caughtStealing", "CS"),
  bat("walks", "BB"),
  bat("hitByPitch", "HBP"),
  bat("strikeouts", "SO"),
  bat("gdp", "GDP"),
  bat("slg", "SLG", "rate"),
  bat("obp", "OBP", "rate"),
  bat("errors", "E"),
  bat("ops", "OPS", "rate"),
];
const pitcherHistory = [
  pit("era", "ERA", (s) => s.era, "era"),
  pit("games", "G", (s) => s.games),
  pit("completeGames", "CG", (s) => s.completeGames),
  pit("shutouts", "SHO", (s) => s.shutouts),
  pit("wins", "W", (s) => s.wins),
  pit("losses", "L", (s) => s.losses),
  pit("saves", "SV", (s) => s.saves),
  pit("holds", "HLD", (s) => s.holds),
  pit("winPct", "WPCT", (s) => s.winPct, "rate"),
  pit("battersFaced", "TBF", (s) => s.battersFaced),
  pit("innings", "IP", (s) => s.outs, "outs"),
  pit("hits", "H", (s) => s.hits),
  pit("homeRuns", "HR", (s) => s.homeRuns),
  pit("walks", "BB", (s) => s.walks),
  pit("hitByPitch", "HBP", (s) => s.hitByPitch),
  pit("strikeouts", "SO", (s) => s.strikeouts),
  pit("runs", "R", (s) => s.runs),
  pit("earnedRuns", "ER", (s) => s.earnedRuns),
];

const sets = {
  list: [batterList, pitcherList],
  compare: [batterCompare, pitcherList],
  history: [batterHistory, pitcherHistory],
} as const;

/**
 * kind 로 고른 시즌 기록 열. 열의 get 은 자기 종류의 기록만 받지만,
 * 화면은 같은 kind 의 기록만 넘기므로 공통 타입으로 넓혀 쓴다.
 */
export function seasonColumns(kind: Kind, set: keyof typeof sets = "list") {
  return sets[set][kind === "pit" ? 1 : 0] as unknown as Column<SeasonStats>[];
}
