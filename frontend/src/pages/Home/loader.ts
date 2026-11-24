import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { dailyRecordsQuery, matchesQuery } from "@/features/match";
import { requestQuery } from "@/utils";

/** 선택한 날짜의 경기 목록과 일별 선수 기록. */
export const homeLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const { date } = requestQuery(request);
    await Promise.all([qc.ensureQueryData(matchesQuery(date)), qc.ensureQueryData(dailyRecordsQuery(date))]);
    return null;
  };
