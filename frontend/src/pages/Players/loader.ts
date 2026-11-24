import type { QueryClient } from "@tanstack/react-query";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { standingsQuery } from "@/features/standing";
import { teamIdOf } from "@/features/team";
import { requestQuery } from "@/utils";
import { rankingOf } from "./ranking";

/** 시즌·팀·이름·최소 출전 조건과 정렬·페이지를 서버(SQL)에 넘겨 선수 기록 목록을 받는다. */
export const playersLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const url = requestQuery(request);
    const [standings, teamId] = await Promise.all([
      qc.ensureQueryData(standingsQuery(url.season)),
      teamIdOf(qc, url.get("team")),
    ]);
    const result = await qc.ensureQueryData(rankingOf(url, standings, teamId).query);
    // 조건이 바뀌어 요청한 페이지가 범위를 벗어나면 마지막 페이지로 옮긴다.
    const last = Math.max(1, result.totalPages);
    if (url.page > last) {
      const next = new URL(request.url);
      next.searchParams.set("page", String(last));
      throw redirect(next.pathname + next.search);
    }
    return null;
  };
