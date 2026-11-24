import { Link } from "react-router";
import { useUrl } from "@/shared/lib";

/** 그 주의 날짜 이동 링크. 경기가 없는 날은 흐리게 표시한다 (GET /api/matches/dates). */
export function WeekCalendar({ days, withGames }: { days: string[]; withGames: Set<string> }) {
  const { date, here } = useUrl();
  return (
    <div className="week">
      {days.map((d, i) => (
        <Link
          key={d}
          to={here({ date: d })}
          className={[d === date ? "active" : "", withGames.has(d) ? "" : "no-games"].join(" ").trim()}
          title={withGames.has(d) ? undefined : "경기 없음"}
        >
          <small>{"월화수목금토일"[i]}</small>
          <b>{Number(d.slice(8))}</b>
        </Link>
      ))}
    </div>
  );
}
