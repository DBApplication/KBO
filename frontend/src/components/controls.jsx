import { Link, useNavigate } from "react-router";
import { useQuery, useReference } from "../hooks.js";
import { displayDate } from "../lib/format.js";
import { shiftDate } from "../lib/records.js";
import { to } from "../lib/query.js";

/** 드롭다운을 바꾸면 그 조건을 주소에 반영하고 첫 페이지로 이동한다. values = [[값, 표시명], ...] */
export function FilterSelect({ name, label, values, selected }) {
  const { here } = useQuery();
  const navigate = useNavigate();
  return (
    <label className="select">
      <span className="sr">{label}</span>
      <select
        aria-label={label}
        value={String(selected)}
        onChange={(e) => navigate(here({ [name]: e.target.value, page: "" }))}
      >
        {values.map(([v, n]) => (
          <option key={v} value={String(v)}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}

/** 전체 팀과 개별 구단을 선택할 수 있는 팀 필터. */
export function TeamSelect() {
  const { teams } = useReference();
  const { get } = useQuery();
  return (
    <FilterSelect
      name="team"
      label="팀 필터"
      values={[["", "전체 팀"], ...teams.map((t) => [t.code, t.name])]}
      selected={get("team")}
    />
  );
}

/** 기록이 있는 시즌 목록으로 시즌 선택기를 만든다. */
export function SeasonSelect() {
  const { seasons } = useReference();
  const { season } = useQuery();
  return (
    <FilterSelect
      name="season"
      label="시즌"
      values={seasons.map((s) => [s, s + " 시즌"])}
      selected={season}
    />
  );
}

/** 타자·투수 탭. 전환하면 이전 종류에 종속된 정렬·비교 조건을 초기화한다. */
export function KindTabs() {
  const { kind, here } = useQuery();
  return (
    <div className="tabs" aria-label="기록 종류">
      {[
        ["bat", "타자"],
        ["pit", "투수"],
      ].map(([v, n]) => (
        <Link
          key={v}
          className={"button " + (kind === v ? "active" : "")}
          to={here({ type: v, sort: "", dir: "", page: "", min: "", left: "", right: "" })}
        >
          {n}
        </Link>
      ))}
    </div>
  );
}

/** 선택한 경기일을 기준으로 전날·다음 날 링크와 날짜 입력란을 만든다. */
export function DateControl() {
  const { date, here } = useQuery();
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

/** 검색 폼. local 은 현재 목록의 필터를 유지한 채 검색하고, global 은 통합 검색 화면으로 이동한다. */
export function SearchForm({ scope, value, placeholder }) {
  const { here } = useQuery();
  const navigate = useNavigate();
  const submit = (e) => {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") || "").trim();
    navigate(scope === "local" ? here({ q, page: "" }) : to("search", { q }));
  };
  return (
    <form className="search" role="search" onSubmit={submit}>
      {/* key 로 주소의 검색어가 바뀌면 입력란도 그 값으로 다시 맞춘다 */}
      <input
        key={value}
        type="search"
        name="q"
        aria-label={placeholder}
        placeholder={placeholder}
        defaultValue={value}
      />
      <button aria-label="검색">
        <i className="lens" aria-hidden="true" />
      </button>
    </form>
  );
}

/** 이전·다음 페이지 링크. 한 페이지뿐이면 숨긴다. */
export function Pager({ current, pages }) {
  const { here } = useQuery();
  if (pages <= 1) return null;
  return (
    <div className="pager">
      {current > 1 ? <Link to={here({ page: current - 1 })}>이전</Link> : null}
      <span>
        {current} / {pages}
      </span>
      {current < pages ? <Link to={here({ page: current + 1 })}>다음</Link> : null}
    </div>
  );
}

/** 기록표 열 제목을 누르면 해당 지표로 정렬하고, 같은 열을 다시 누르면 방향을 바꾼다. */
export function StatHeader({ k, label, sort, asc, defaultAsc = false }) {
  const { here } = useQuery();
  const active = k === sort;
  return (
    <Link
      className={"sort" + (active ? " selected" : "")}
      to={here({ sort: k, dir: (active ? !asc : defaultAsc) ? "asc" : "desc", page: "" })}
    >
      {label}
      {active ? (asc ? " ↑" : " ↓") : ""}
    </Link>
  );
}
