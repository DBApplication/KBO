import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { Link, type LoaderFunctionArgs } from "react-router";
import { matchDatesQuery, matchesQuery, teamIdOf } from "../api/queries.ts";
import type { MatchSummary } from "../api/types.ts";
import { teamShort, useUrl, useReference } from "../hooks.ts";
import { displayDate, formatStat, localToday, shiftDate } from "../lib/format.ts";
import { requestQuery, to, type UrlQuery } from "../lib/query.ts";
import {
  Count,
  DataTable,
  Empty,
  ExternalLink,
  Heading,
  NextLink,
  SectionTitle,
} from "../components/common.tsx";
import { DateControl, FilterSelect, TeamSelect } from "../components/controls.tsx";
import { NoGames, gameUrl, statuses } from "./match-shared.tsx";

/** 선택 날짜가 속한 주의 월요일 ~ 일요일. */
function weekOf(date: string): string[] {
  const day = new Date(date + "T12:00:00Z").getUTCDay();
  const monday = shiftDate(date, -((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => shiftDate(monday, i));
}

/** 주소 조건 → 이 화면의 쿼리들. 로더와 컴포넌트가 같은 쿼리를 쓴다. */
function queries({ date, get }: UrlQuery, teamId: number | "") {
  const week = weekOf(date);
  return {
    filtered: Boolean(get("team") || get("status")),
    rows: matchesQuery(date, { teamId, status: get("status") }),
    allDay: matchesQuery(date),
    week,
    weekDates: matchDatesQuery(week[0]!, week[6]!, teamId),
  };
}

/** 날짜·팀·경기 상태 조건에 맞는 경기와 그 주의 경기 있는 날. 조건은 서버(SQL)에서 거른다. */
export const loader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const query = requestQuery(request);
    const q = queries(query, await teamIdOf(qc, query.get("team")));
    await Promise.all([
      qc.ensureQueryData(q.rows),
      qc.ensureQueryData(q.weekDates),
      q.filtered ? qc.ensureQueryData(q.allDay) : null,
    ]);
    return null;
  };

/** 그 주의 날짜 이동 링크. 경기가 없는 날은 흐리게 표시한다 (GET /api/matches/dates). */
function Week({ days, withGames }: { days: string[]; withGames: Set<string> }) {
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

/** 영상 한 개는 외부 재생 링크로, 여러 개는 경기 상세의 영상 목록으로 연결한다 (서버의 버튼 규칙 actions). */
function HighlightLink({ game: g }: { game: MatchSummary }) {
  if (g.actions.highlightUrl)
    return <ExternalLink href={g.actions.highlightUrl}>하이라이트</ExternalLink>;
  if (g.actions.highlightList) return <NextLink to={gameUrl(g)}>하이라이트 목록</NextLink>;
  return null;
}

/** 필터가 있을 때만 그 날 전체 경기를 읽어 "조건에 맞는 경기 없음"과 "경기 없음"을 구분한다. */
function EmptyResult({ allDay }: { allDay: ReturnType<typeof matchesQuery> }) {
  const { date } = useUrl();
  const { data } = useSuspenseQuery(allDay);
  return data.length ? (
    <Empty title="조건에 맞는 경기가 없습니다.">
      <NextLink to={to("games", { date })}>필터 초기화</NextLink>
    </Empty>
  ) : (
    <NoGames />
  );
}

/** 날짜·팀·경기 상태 조건에 맞는 일정을 표시하고 경기 상세로 연결한다. */
export default function Games() {
  const query = useUrl();
  const { date, get, here } = query;
  const { teamByCode } = useReference();
  const q = queries(query, teamByCode(get("team"))?.id ?? "");
  const { data: rows } = useSuspenseQuery(q.rows);
  const { data: weekDates } = useSuspenseQuery(q.weekDates);

  let body;
  if (rows.length)
    body = (
      <DataTable
        caption="경기 목록"
        className="matches"
        headers={["시각", "구장", "원정", "점수", "홈", "상태", "기록"]}
        rows={rows.map((g) => [
          g.matchTime?.slice(0, 5) || "—",
          (g.stadium ?? "") + (g.doubleheader ? ` · DH${g.doubleheader}` : ""),
          teamShort(g.awayTeam),
          <strong>
            {formatStat(g.awayScore)} : {formatStat(g.homeScore)}
          </strong>,
          teamShort(g.homeTeam),
          statuses[g.status] || g.status,
          <div className="row-actions">
            <NextLink to={gameUrl(g)}>경기 기록</NextLink>
            <HighlightLink game={g} />
          </div>,
        ])}
      />
    );
  else if (q.filtered) body = <EmptyResult allDay={q.allDay} />;
  else body = <NoGames />;

  return (
    <div className="wrap page">
      <Heading title="경기 기록" sub="날짜별 경기 결과를 확인하세요." />
      <div className="toolbar">
        <div className="controls">
          <DateControl />
          <Link className="button" to={here({ date: localToday() })}>
            오늘
          </Link>
        </div>
        <div className="controls">
          <TeamSelect />
          <FilterSelect
            name="status"
            label="경기 상태"
            selected={get("status")}
            values={[
              ["", "전체 상태"],
              ["FINISHED", "경기 종료"],
              ["CANCELED", "경기 취소"],
            ]}
          />
        </div>
      </div>
      <Week days={q.week} withGames={new Set(weekDates)} />
      <SectionTitle title={displayDate(date, true) + " 경기"}>
        <Count>{rows.length}경기</Count>
      </SectionTitle>
      {body}
    </div>
  );
}
