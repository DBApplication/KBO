import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { recentMatchesQuery } from "@/features/match";
import { standingsQuery } from "@/features/standing";
import { requestQuery } from "@/utils";
import { RECENT_GAMES } from "./HomePage";

/** 기준 날짜까지의 최근 경기와, 그 날짜가 속한 시즌의 팀 순위. */
export const homeLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const { date } = requestQuery(request);
    await Promise.all([
      qc.ensureQueryData(recentMatchesQuery(qc, date, RECENT_GAMES)),
      qc.ensureQueryData(standingsQuery(date.slice(0, 4))),
    ]);
    return null;
  };
