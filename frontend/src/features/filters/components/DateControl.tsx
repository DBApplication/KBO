import { Link, useNavigate } from "react-router";
import { useUrl } from "@/hooks";
import { displayDate, shiftDate } from "@/utils";

/** 선택한 경기일을 기준으로 전날·다음 날 링크와 날짜 입력란. */
export function DateControl() {
  const { date, here } = useUrl();
  const navigate = useNavigate();
  return (
    <div className="date-control">
      <Link to={here({ date: shiftDate(date, -1), page: "" })}>
        <span aria-hidden="true">‹</span>
        <span className="sr">전날</span>
      </Link>
      <label className="date-label">
        {displayDate(date)}
        <input
          type="date"
          aria-label="기록 날짜 선택"
          value={date}
          onChange={(e) => {
            if (e.target.value) navigate(here({ date: e.target.value, page: "" }));
          }}
        />
      </label>
      <Link to={here({ date: shiftDate(date, 1), page: "" })}>
        <span aria-hidden="true">›</span>
        <span className="sr">다음 날</span>
      </Link>
    </div>
  );
}
