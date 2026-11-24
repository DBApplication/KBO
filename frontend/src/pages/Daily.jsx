import { Link, useLoaderData } from "react-router";
import * as api from "../lib/api.js";
import { requestQuery, to } from "../lib/query.js";
import { useQuery } from "../hooks.js";
import { DateControl } from "../components/controls.jsx";
import { DailyRecords } from "./match-shared.jsx";

/** 그 날 일별 선수 기록. 기록이 비어 있으면 미수집 안내를 위해 경기 목록도 받는다. */
export async function loader({ request }) {
  const { date } = requestQuery(request);
  const records = await api.dailyRecords(date);
  const games = records.bat.length && records.pit.length ? [] : await api.matches(date);
  return { records, games };
}

/** 날짜를 바꾸거나 페이지를 넘겨 전체 일별 출전 기록을 볼 수 있는 화면. */
export default function Daily() {
  const { records, games } = useLoaderData();
  const { date } = useQuery();
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
