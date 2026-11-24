/**
 * 백엔드 응답 DTO 타입 (backend/src/main/java/com/dbapplication/kbo/**​/dto).
 * Java → JSON 변환 규칙: Long·Integer·BigDecimal → number, LocalDate → "YYYY-MM-DD",
 * LocalTime → "HH:MM:SS", 래퍼 타입(Integer 등)과 String 은 null 이 올 수 있다.
 * 백엔드 DTO 를 바꾸면 이 파일도 같이 고친다.
 */

/** YYYY-MM-DD */
export type IsoDate = string;

// ------------------------------------------------------------------ 공통

/** global/dto/PageResponse */
export interface PageResponse<T> {
  content: T[];
  /** 0부터 */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** global/error/ErrorResponse */
export interface ErrorResponse {
  /** ErrorCode 의 코드 (C001, P001, M001, R002 …) */
  code: string;
  message: string;
  status: number;
  errors: { field: string; value: string; reason: string }[];
  timestamp: string;
}

// ------------------------------------------------------------------ 팀·선수

/** team/dto/TeamSummary */
export interface TeamSummary {
  id: number;
  code: string | null;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

/** player/dto/PlayerType — position 이 '투수'면 PITCHER */
export type PlayerType = "BATTER" | "PITCHER";

/** player/dto/PlayerSummary */
export interface PlayerSummary {
  id: number;
  name: string;
  position: string | null;
  imageUrl: string | null;
}

/** player/dto/PlayerDetailResponse */
export interface PlayerDetail {
  id: number;
  name: string;
  type: PlayerType;
  position: string | null;
  /** 예: 우투우타 */
  throwBat: string | null;
  birthDate: IsoDate | null;
  /** cm */
  height: number | null;
  /** kg */
  weight: number | null;
  imageUrl: string | null;
  team: TeamSummary | null;
}

/** player/dto/PlayerSearchItem */
export interface PlayerSearchItem {
  id: number;
  name: string;
  type: PlayerType;
  position: string | null;
  imageUrl: string | null;
  team: TeamSummary | null;
}

// ------------------------------------------------------------------ 경기

/** match/entity/MatchStatus */
export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "FINISHED" | "CANCELED";

/** match/dto/MatchActions — 경기 상태별 버튼 규칙 */
export interface MatchActions {
  /** 예정 경기의 예매 주소 */
  ticketUrl: string | null;
  showRecord: boolean;
  /** 종료 경기에 영상이 하나면 그 주소 */
  highlightUrl: string | null;
  /** 종료 경기에 영상이 여러 개면 true (상세 화면 목록으로 연결) */
  highlightList: boolean;
}

/** match/dto/MatchSummaryResponse */
export interface MatchSummary {
  id: number;
  kboGameId: string;
  season: number;
  matchDate: IsoDate;
  /** HH:MM:SS */
  matchTime: string | null;
  stadium: string | null;
  status: MatchStatus | string;
  doubleheader: number | null;
  sequence: number | null;
  awayTeam: TeamSummary | null;
  homeTeam: TeamSummary | null;
  awayScore: number | null;
  homeScore: number | null;
  result: "HOME_WIN" | "AWAY_WIN" | "DRAW" | null;
  highlightCount: number;
  actions: MatchActions;
}

/** match/dto/HighlightResponse */
export interface Highlight {
  id: number;
  title: string;
  url: string;
}

/** match/dto/ScoreboardResponse */
export interface Scoreboard {
  innings: number;
  away: ScoreboardLine;
  home: ScoreboardLine;
}
export interface ScoreboardLine {
  team: TeamSummary | null;
  /** 이닝별 득점 ("X" 는 9회말 공격 없음) */
  scores: string[];
  runs: number;
  hits: number;
  errors: number;
}

/** match/dto/MatchEventResponse — 결승타, 홈런 같은 주요 기록 */
export interface MatchEvent {
  type: string;
  itemNo: number | null;
  description: string;
}

/** match/dto/BatterGameRecordResponse — 선수 확인이 안 된 기록(동명이인 등)은 player 가 null */
export interface BatterGameRecord {
  matchId: number;
  team: TeamSummary | null;
  homeAway: "HOME" | "AWAY";
  seq: number | null;
  player: PlayerSummary | null;
  playerName: string;
  battingOrder: number | null;
  position: string | null;
  pa: number | null;
  ab: number | null;
  hits: number | null;
  doubles: number | null;
  triples: number | null;
  homeRuns: number | null;
  totalBases: number | null;
  rbi: number | null;
  runs: number | null;
  walks: number | null;
  hitByPitch: number | null;
  strikeouts: number | null;
  sacFlies: number | null;
  avg: number | null;
  obp: number | null;
  slg: number | null;
  ops: number | null;
}

/** match/dto/PitcherGameRecordResponse */
export interface PitcherGameRecord {
  matchId: number;
  team: TeamSummary | null;
  homeAway: "HOME" | "AWAY";
  seq: number | null;
  player: PlayerSummary | null;
  playerName: string;
  starter: boolean | null;
  decision: string | null;
  /** 아웃 수 (이닝 × 3) */
  outs: number | null;
  /** 이닝 표기 (예: "6 1/3") */
  innings: string | null;
  battersFaced: number | null;
  pitches: number | null;
  hitsAllowed: number | null;
  homeRunsAllowed: number | null;
  bbHbp: number | null;
  strikeouts: number | null;
  runsAllowed: number | null;
  earnedRuns: number | null;
  era: number | null;
}

/** match/dto/MatchDetailResponse */
export interface MatchDetail {
  match: MatchSummary;
  highlights: Highlight[];
  scoreboard: Scoreboard | null;
  events: MatchEvent[];
  batters: BatterGameRecord[];
  pitchers: PitcherGameRecord[];
}

/** match/dto/DailyPlayerRecordsResponse */
export interface DailyPlayerRecords {
  date: IsoDate;
  batters: BatterGameRecord[];
  pitchers: PitcherGameRecord[];
}

// ------------------------------------------------------------------ 시즌 기록

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

/** record/dto/StandingsResponse */
export interface Standings {
  season: number;
  /** 순위 기준일 */
  asOfDate: IsoDate;
  standings: StandingRow[];
}
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

// ------------------------------------------------------------------ 화면 공통

/** 화면의 기록 종류: 타자(bat) · 투수(pit) */
export type Kind = "bat" | "pit";
export type StatsOf<K extends Kind> = K extends "bat" ? BatterStats : PitcherStats;

/** RecordController 의 정렬 키 (BatterRecordService.SORTABLE) */
export type BatterSortKey = keyof BatterStats | "name" | "team";
/** RecordController 의 정렬 키 (PitcherRecordService.SORTABLE). 이닝 정렬은 outs 가 아니라 innings */
export type PitcherSortKey =
  | Exclude<keyof PitcherStats, "outs" | "innings">
  | "innings"
  | "name"
  | "team";
