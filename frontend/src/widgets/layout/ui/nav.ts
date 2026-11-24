// 상단 메뉴에 보이는 화면. 상세 화면은 소속 메뉴를 강조한다 (경기 상세 → 경기 기록).
export const NAV = [
  ["home", "홈"],
  ["games", "경기 기록"],
  ["players", "선수 기록"],
  ["teams", "팀 기록"],
  ["compare", "선수 비교"],
] as const;

export const NAV_PARENT: Record<string, string> = { game: "games", player: "players", daily: "home" };

/** 브라우저 탭 제목 */
export const TITLES: Record<string, string> = {
  ...Object.fromEntries(NAV),
  game: "경기 상세",
  player: "선수 상세",
  daily: "일별 선수 기록",
  search: "검색",
};

/** 주소 첫 단계로 화면 이름을 정한다 ("/" 는 홈). */
export function pageOf(pathname: string): string {
  return pathname.replace(/^\//, "").split("/")[0] || "home";
}
