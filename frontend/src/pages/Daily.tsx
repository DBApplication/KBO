import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { Link, type LoaderFunctionArgs } from "react-router";
import { dailyRecordsQuery, matchesQuery } from "../api/queries.ts";
import { useUrl } from "../hooks.ts";
import { requestQuery, to } from "../lib/query.ts";
import { DateControl } from "../components/controls.tsx";
import { DailyRecords } from "./match-shared.tsx";

/** 그 날 일별 선수 기록과 경기 목록 (기록이 비었을 때 미수집인지 구분하는 데 쓴다). */
export const loader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const { date } = requestQuery(request);
    await Promise.all([
      qc.ensureQueryData(dailyRecordsQuery(date)),
      qc.ensureQueryData(matchesQuery(date)),
    ]);
    return null;
  };

/** 날짜를 바꾸거나 페이지를 넘겨 전체 일별 출전 기록을 볼 수 있는 화면. */
export default function Daily() {
  const { date } = useUrl();
  const { data: records } = useSuspenseQuery(dailyRecordsQuery(date));
  const { data: games } = useSuspenseQuery(matchesQuery(date));
  return (
    <div className="wrap page">
      <Link className="back" to={to("home", { date })}>
        ‹ 홈
      </Link>
      <div className="toolbar">
        <DateControl />
      </div>
      <DailyRecords records={records} games={games} full />
    </div>
  );
}
