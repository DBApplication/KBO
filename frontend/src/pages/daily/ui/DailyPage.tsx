import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { dailyRecordsQuery, matchesQuery } from "@/entities/match";
import { DateControl } from "@/features/filters";
import { to, useUrl } from "@/shared/lib";
import { DailyRecords } from "@/widgets/daily-records";

/** 날짜를 바꾸거나 페이지를 넘겨 전체 일별 출전 기록을 볼 수 있는 화면. */
export function DailyPage() {
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
