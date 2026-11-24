import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { dailyRecordsQuery, matchesQuery } from "@/features/match";
import { requestQuery } from "@/utils";

/** 그 날 일별 선수 기록과 경기 목록 (기록이 비었을 때 미수집인지 구분하는 데 쓴다). */
export const dailyLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const { date } = requestQuery(request);
    await Promise.all([qc.ensureQueryData(dailyRecordsQuery(date)), qc.ensureQueryData(matchesQuery(date))]);
    return null;
  };
