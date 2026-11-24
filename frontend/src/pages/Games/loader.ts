import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { teamIdOf } from "@/features/team";
import { requestQuery } from "@/utils";
import { gamesQueries } from "./gamesQueries";

/** 날짜·팀·경기 상태 조건에 맞는 경기와 그 주의 경기 있는 날. 조건은 서버(SQL)에서 거른다. */
export const gamesLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const url = requestQuery(request);
    const q = gamesQueries(url, await teamIdOf(qc, url.get("team")));
    await Promise.all([
      qc.ensureQueryData(q.rows),
      qc.ensureQueryData(q.weekDates),
      q.filtered ? qc.ensureQueryData(q.allDay) : null,
    ]);
    return null;
  };
