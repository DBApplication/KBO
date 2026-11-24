import { DataTable, Empty, FilterSelect, NextLink, Pager, SectionTitle, StatHeader } from "@/components";
import { DEFAULT_DATE, PAGE_SIZE, ROUTES } from "@/constants";
import { KindTabs, TeamSelect } from "@/features/filters";
import { PlayerLink } from "@/features/player";
import { useUrl } from "@/hooks";
import type { DailyPlayerRecords, MatchSummary } from "@/types";
import { displayDate, formatStat, paging, to } from "@/utils";
import { dailyRows } from "../dailyRows";

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
  const { rows, all, cols, sortCol, asc, min, pit } = dailyRows(records, kind, {
    team: get("team"),
    min: get("min"),
    sort: get("sort"),
    dir: get("dir"),
  });
  const { offset, current, pages } = paging(rows.length, page);
  const start = full ? offset : 0;
  const shown = rows.slice(start, start + (full ? PAGE_SIZE : 8));
  const headingText = displayDate(date, true) + " 선수 기록";

  const top = (
    <SectionTitle title={headingText}>
      {full ? null : (
        <NextLink to={to(ROUTES.DAILY, { ...Object.fromEntries(params), date, page: "" })}>전체 기록 보기</NextLink>
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
          <NextLink to={to(ROUTES.HOME, { date: DEFAULT_DATE })}>6월 1일 기록 보기</NextLink>{" "}
          <NextLink to={to(ROUTES.PLAYERS)}>시즌 기록 보기</NextLink>
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
