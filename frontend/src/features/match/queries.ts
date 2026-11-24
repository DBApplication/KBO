import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { fetchDailyRecords, fetchMatch, fetchMatchDates, fetchMatches, fetchStandingSeasons, type MatchFilter } from "@/api";
import { DEFAULT_DATE } from "@/constants";
import type { IsoDate, MatchSummary } from "@/types";
import { shiftDate } from "@/utils";

/**
 * 기록이 있는 가장 최근 경기일. 최신 시즌의 경기 날짜 목록에서 마지막 날을 고른다.
 * 주소에 날짜가 없을 때의 기본 날짜로 쓴다 (오늘은 비시즌이면 경기가 없다).
 */
export const latestMatchDateQuery = () =>
  queryOptions({
    queryKey: ["latest-match-date"],
    queryFn: async (): Promise<IsoDate> => {
      const seasons = await fetchStandingSeasons();
      const season = seasons[0];
      if (!season) return DEFAULT_DATE;
      const dates = await fetchMatchDates(`${season}-01-01`, `${season}-12-31`);
      return dates.at(-1) ?? DEFAULT_DATE;
    },
  });

export const matchesQuery = (date: IsoDate, filter: MatchFilter = {}) =>
  queryOptions({
    queryKey: ["matches", date, filter.teamId || "", filter.status || ""],
    queryFn: () => fetchMatches(date, filter),
  });

export const matchDatesQuery = (from: IsoDate, to: IsoDate, teamId?: number | "") =>
  queryOptions({
    queryKey: ["matches", "dates", from, to, teamId || ""],
    queryFn: () => fetchMatchDates(from, to, teamId),
  });

export const matchQuery = (id: string) => queryOptions({ queryKey: ["match", id], queryFn: () => fetchMatch(id) });

export const dailyRecordsQuery = (date: IsoDate) =>
  queryOptions({ queryKey: ["daily-records", date], queryFn: () => fetchDailyRecords(date) });

/** 최근 경기를 찾을 때 거슬러 올라가는 기간(일) */
const RECENT_RANGE_DAYS = 30;

/**
 * 기준 날짜까지의 최근 경기 limit 개. 경기가 있었던 날을 최신순으로 훑어 모은다.
 * 날짜는 최신순, 같은 날은 시작 시각순.
 * 날짜별 목록은 matchesQuery 캐시를 함께 써서 같은 날을 두 번 요청하지 않는다.
 */
export const recentMatchesQuery = (qc: QueryClient, date: IsoDate, limit = 10) =>
  queryOptions({
    queryKey: ["matches", "recent", date, limit],
    queryFn: async (): Promise<MatchSummary[]> => {
      const dates = await qc.ensureQueryData(matchDatesQuery(shiftDate(date, -RECENT_RANGE_DAYS), date));
      const games: MatchSummary[] = [];
      for (const day of [...dates].sort().reverse()) {
        if (games.length >= limit) break;
        const dayGames = await qc.ensureQueryData(matchesQuery(day));
        games.push(...[...dayGames].sort((a, b) => (a.matchTime ?? "").localeCompare(b.matchTime ?? "")));
      }
      return games.slice(0, limit);
    },
  });
