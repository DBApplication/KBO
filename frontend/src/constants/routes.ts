/** 화면 경로 (해시 주소 #/<경로>?조건). to(ROUTES.PLAYERS, { season }) 처럼 쓴다. */
export const ROUTES = {
  HOME: "home",
  DAILY: "daily",
  GAMES: "games",
  GAME: "game",
  PLAYERS: "players",
  PLAYER: "player",
  TEAMS: "teams",
  COMPARE: "compare",
  SEARCH: "search",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

// 상단 메뉴에 보이는 화면. 상세 화면은 소속 메뉴를 강조한다 (경기 상세 → 경기 기록).
export const NAV = [
  [ROUTES.HOME, "홈"],
  [ROUTES.GAMES, "경기 기록"],
  [ROUTES.PLAYERS, "선수 기록"],
  [ROUTES.TEAMS, "팀 기록"],
  [ROUTES.COMPARE, "선수 비교"],
] as const;

export const NAV_PARENT: Record<string, string> = {
  [ROUTES.GAME]: ROUTES.GAMES,
  [ROUTES.PLAYER]: ROUTES.PLAYERS,
  [ROUTES.DAILY]: ROUTES.HOME,
};

/** 브라우저 탭 제목 */
export const TITLES: Record<string, string> = {
  ...Object.fromEntries(NAV),
  [ROUTES.GAME]: "경기 상세",
  [ROUTES.PLAYER]: "선수 상세",
  [ROUTES.DAILY]: "일별 선수 기록",
  [ROUTES.SEARCH]: "검색",
};
