/**
 * 백엔드 API 경로 (/api 뒤). 백엔드 컨트롤러(backend/.../controller)와 1:1.
 * 개발 서버는 /api 를 localhost:8080 으로 넘긴다 (vite.config.ts).
 */
const id = (v: string | number) => encodeURIComponent(v);

export const ENDPOINTS = {
  TEAMS: "/teams",
  STANDINGS: "/standings",
  STANDING_SEASONS: "/standings/seasons",
  MATCHES: "/matches",
  MATCH_DATES: "/matches/dates",
  MATCH: (matchId: string | number) => `/matches/${id(matchId)}`,
  DAILY_PLAYER_RECORDS: "/matches/player-records",
  PLAYERS: "/players",
  PLAYER: (playerId: string | number) => `/players/${id(playerId)}`,
  PLAYER_BATTER_RECORDS: (playerId: string | number) => `/players/${id(playerId)}/records/batter`,
  PLAYER_PITCHER_RECORDS: (playerId: string | number) => `/players/${id(playerId)}/records/pitcher`,
  RECORD_SEASONS: "/records/seasons",
  BATTERS: "/records/batters",
  PITCHERS: "/records/pitchers",
  BATTERS_COMPARE: "/records/batters/compare",
  PITCHERS_COMPARE: "/records/pitchers/compare",
} as const;
