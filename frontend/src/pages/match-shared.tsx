/** 홈·일별 기록·경기 목록·경기 상세가 함께 쓰는 경기 카드와 일별 선수 기록 표. */
import { Link } from "react-router";
import type { DailyPlayerRecords, MatchSummary } from "../api/types.ts";
import { teamShort, useUrl } from "../hooks.ts";
import { displayDate, formatStat, sortBy } from "../lib/format.ts";
import { DEFAULT_DATE, PAGE_SIZE, paging, to } from "../lib/query.ts";
import { gameColumns, type GameRecord } from "../lib/stats.ts";
import { DataTable, Empty, NextLink, PlayerLink, SectionTitle } from "../components/common.tsx";
import { FilterSelect, KindTabs, Pager, StatHeader, TeamSelect } from "../components/controls.tsx";

export const statuses: Record<string, string> = {
  FINISHED: "경기 종료",
  CANCELED: "경기 취소",
  SCHEDULED: "경기 예정",
  IN_PROGRESS: "경기 중",
};

/** 더블헤더 경기도 구분할 수 있도록 DB 경기 id를 포함한 상세 주소를 만든다. */
export function gameUrl(g: MatchSummary): string {
  return to("game", { id: g.id, date: g.matchDate });
}

/** 구장, 경기 상태, 홈·원정 점수를 한 장의 경기 카드로 표시한다. */
export function GameCard({ game: g }: { game: MatchSummary }) {
  /** 지정한 팀의 점수를 표시하고 종료 경기에서 이긴 팀에 승리 표시를 붙인다. */
  const side = (s: "away" | "home") => {
    const winner = s === "home" ? g.result === "HOME_WIN" : g.result === "AWAY_WIN";
    return (
      <div className={`scoreline ${winner ? "winner" : ""}`}>
        <span>
          {teamShort(s === "home" ? g.homeTeam : g.awayTeam)} {winner ? <b>승</b> : null}{" "}
          <small>{s === "away" ? "원정" : "홈"}</small>
        </span>
        <strong>{formatStat(s === "home" ? g.homeScore : g.awayScore)}</strong>
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
 * 필터·정렬은 그 날 기록 전체를 받아 화면에서 한다. games 는 기록이 없을 때 미수집인지 구분하는 데 쓴다.
 */
export function DailyRecords({
  records,
  games,
  full = false,
}: {
  records: DailyPlayerRecords;
  games: MatchSummary[];
  full?: boolean;
}) {
  const { kind, date, get, page, params } = useUrl();
  const pit = kind === "pit";
  const cols = gameColumns(kind);
  const all: GameRecord[] = pit ? records.pitchers : records.batters;
  const minOf = (r: GameRecord) => ("outs" in r ? r.outs : r.ab) ?? 0;
  const min = get("min", pit ? "0" : "3");
  const sortCol = cols.find((c) => c.key === get("sort")) ?? cols.find((c) => c.key === (pit ? "strikeouts" : "hits"))!;
  const asc = get("dir") === "asc";
  const tie = (r: GameRecord) => ("outs" in r ? r.outs : r.rbi);
  const rows = sortBy(
    all.filter((r) => (!get("team") || r.team?.code === get("team")) && minOf(r) >= Number(min)),
    sortCol.get,
    asc,
    tie,
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
              ...cols.map((c) => (
                <StatHeader k={c.key} label={c.label} sort={sortCol.key} asc={asc} defaultAsc={c.key === "era"} />
              )),
            ]}
            rows={shown.map((r, i) => [
              start + i + 1,
              <PlayerLink id={r.player?.id} name={r.playerName} type={kind} />,
              r.team?.shortName,
              ...cols.map((c) => formatStat(c.get(r), c.format)),
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
