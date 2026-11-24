/** 홈·일별 기록·경기 목록·경기 상세가 함께 쓰는 경기 카드와 일별 선수 기록 표. */
import { Link } from "react-router";
import { useQuery, useReference } from "../hooks.js";
import { displayDate } from "../lib/format.js";
import { formatStat, sortRecords } from "../lib/records.js";
import { DEFAULT_DATE, PAGE_SIZE, paging, to } from "../lib/query.js";
import { DataTable, Empty, NextLink, PlayerLink, SectionTitle } from "../components/common.jsx";
import { FilterSelect, KindTabs, Pager, StatHeader, TeamSelect } from "../components/controls.jsx";

export const statuses = {
  FINISHED: "경기 종료",
  CANCELED: "경기 취소",
  SCHEDULED: "경기 예정",
  IN_PROGRESS: "경기 중",
};
export const batDaily = [
  ["at_bats", "타수"],
  ["hits", "안타"],
  ["home_runs", "홈런"],
  ["rbi", "타점"],
  ["runs", "득점"],
  ["ops", "OPS"],
];
export const pitDaily = [
  ["outs_recorded", "이닝"],
  ["strikeouts", "탈삼진"],
  ["hits_allowed", "피안타"],
  ["earned_runs", "자책"],
  ["pitches", "투구 수"],
  ["game_era", "ERA"],
];

/** 더블헤더 경기도 구분할 수 있도록 DB 경기 id를 포함한 상세 주소를 만든다. */
export function gameUrl(g) {
  return to("game", { id: g.id, date: g.match_date });
}

/** 구장, 경기 상태, 홈·원정 점수를 한 장의 경기 카드로 표시한다. */
export function GameCard({ game: g }) {
  const { shortTeam } = useReference();
  /** 지정한 팀의 점수를 표시하고 종료 경기에서 이긴 팀에 승리 표시를 붙인다. */
  const side = (s) => {
    const other = s === "home" ? "away" : "home";
    const winner =
      g.status === "FINISHED" && Number(g[s + "_score"]) > Number(g[other + "_score"]);
    return (
      <div className={`scoreline ${winner ? "winner" : ""}`}>
        <span>
          {shortTeam(g[s + "_team_code"])} {winner ? <b>승</b> : null}{" "}
          <small>{s === "away" ? "원정" : "홈"}</small>
        </span>
        <strong>{formatStat("score", g[s + "_score"])}</strong>
      </div>
    );
  };
  return (
    <Link className="game-card" to={gameUrl(g)}>
      <div className="card-meta">
        <span>{g.stadium}</span>
        <span>{statuses[g.status] || g.status}</span>
      </div>
      {side("away")}
      {side("home")}
      <div className="card-bottom">
        경기 기록 <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}

/** 선택한 날짜에 경기 자료가 없을 때 날짜 변경을 안내한다. */
export function NoGames() {
  return <Empty title="해당 날짜의 경기 기록이 없습니다." sub="다른 날짜를 선택해 보세요." />;
}

/**
 * 일별 출전 기록에 팀·최소 타수 또는 이닝 조건을 적용해 홈 미리보기(8명)나 전체 목록(25명씩)을 만든다.
 * records = { bat, pit }, games = 그 날 경기 (기록이 없을 때 미수집인지 구분하는 데 쓴다).
 */
export function DailyRecords({ records, games, full = false }) {
  const { kind, date, get, page, params } = useQuery();
  const pit = kind === "pit";
  const cols = pit ? pitDaily : batDaily;
  const all = records[pit ? "pit" : "bat"];
  const minKey = pit ? "outs_recorded" : "at_bats";
  const min = get("min", pit ? "0" : "3");
  const sort = cols.some(([k]) => k === get("sort")) ? get("sort") : pit ? "strikeouts" : "hits";
  const asc = get("dir") === "asc";
  const rows = sortRecords(
    all.filter(
      (r) => (!get("team") || r.team_code === get("team")) && Number(r[minKey]) >= Number(min),
    ),
    sort,
    asc,
    pit ? "outs_recorded" : "rbi",
  );
  const { offset, current, pages } = paging(rows.length, page);
  const start = full ? offset : 0;
  const shown = rows.slice(start, start + (full ? PAGE_SIZE : 8));
  const headingText = displayDate(date, true) + " 선수 기록";

  const top = (
    <SectionTitle title={headingText}>
      {full ? null : (
        <NextLink to={to("daily", { ...Object.fromEntries(params), date, page: "" })}>
          전체 기록 보기
        </NextLink>
      )}
    </SectionTitle>
  );

  if (!all.length) {
    const message = games.some((g) => g.status === "FINISHED")
      ? "이 날짜의 일별 선수 기록은 아직 수집되지 않았습니다."
      : "표시할 일별 선수 기록이 없습니다.";
    return (
      <>
        {top}
        <Empty title={message}>
          <NextLink to={to("home", { date: DEFAULT_DATE })}>6월 1일 기록 보기</NextLink>{" "}
          <NextLink to={to("players")}>시즌 기록 보기</NextLink>
        </Empty>
      </>
    );
  }

  return (
    <>
      {top}
      <div className="toolbar">
        <KindTabs />
        <div className="controls">
          <TeamSelect />
          <FilterSelect
            name="min"
            label="최소 기록"
            selected={min}
            values={
              pit
                ? [
                    ["0", "이닝 제한 없음"],
                    ["3", "1이닝 이상"],
                    ["15", "5이닝 이상"],
                  ]
                : [
                    ["0", "타수 제한 없음"],
                    ["3", "3타수 이상"],
                    ["4", "4타수 이상"],
                  ]
            }
          />
        </div>
      </div>
      <p className="meta">
        {rows.length}개 출전 기록 · {shown.length}개 표시
      </p>
      {shown.length ? (
        <>
          <DataTable
            caption={headingText}
            className="records"
            headers={[
              "순번",
              "선수",
              "팀",
              ...cols.map(([k, n]) => (
                <StatHeader k={k} label={n} sort={sort} asc={asc} defaultAsc={k === "game_era"} />
              )),
            ]}
            rows={shown.map((r, i) => [
              start + i + 1,
              <PlayerLink id={r.player_id} name={r.player_name} type={kind} />,
              r.team_name,
              ...cols.map(([k]) => formatStat(k, r[k])),
            ])}
          />
          {full ? <Pager current={current} pages={pages} /> : null}
        </>
      ) : (
        <Empty title="조건에 맞는 출전 기록이 없습니다." />
      )}
      <p className="meta">
        {displayDate(date)} 경기 종료 기록 ·{" "}
        {pit ? "이닝은 기록한 아웃 수 기준" : "OPS는 해당 경기 출루율과 장타율의 합"}
      </p>
    </>
  );
}
