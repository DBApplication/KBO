import { queryOptions } from "@tanstack/react-query";
import { fetchDailyRecords, fetchMatch, fetchMatchDates, fetchMatches, type MatchFilter } from "@/api";
import type { IsoDate } from "@/types";

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
