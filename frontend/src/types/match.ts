import type { IsoDate } from "./api";
import type { PlayerSummary } from "./player";
import type { TeamSummary } from "./team";

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

/** 타자·투수 경기 기록 공통 (선수·팀) */
export type GameRecord = BatterGameRecord | PitcherGameRecord;

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
