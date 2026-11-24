import { matchDatesQuery, matchesQuery } from "@/features/match";
import { shiftDate, type UrlQuery } from "@/utils";

/** 선택 날짜가 속한 주의 월요일 ~ 일요일. */
export function weekOf(date: string): string[] {
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  const monday = shiftDate(date, -((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}

/** 주소 조건 → 경기 기록 화면의 쿼리들. 로더와 컴포넌트가 같은 쿼리를 쓴다. */
export function gamesQueries({ date, get }: UrlQuery, teamId: number | "") {
  const week = weekOf(date);
  return {
    filtered: Boolean(get("team") || get("status")),
    rows: matchesQuery(date, { teamId, status: get("status") }),
    allDay: matchesQuery(date),
    week,
    weekDates: matchDatesQuery(week[0]!, week[6]!, teamId),
  };
}
