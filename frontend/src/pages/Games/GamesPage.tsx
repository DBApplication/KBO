import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Count, DataTable, Empty, ExternalLink, FilterSelect, Heading, NextLink, SectionTitle } from "@/components";
import { ROUTES } from "@/constants";
import { DateControl, TeamSelect } from "@/features/filters";
import { gameUrl, matchesQuery, statusLabel } from "@/features/match";
import { teamShort } from "@/features/team";
import { useTeams, useUrl } from "@/hooks";
import type { MatchSummary } from "@/types";
import { displayDate, formatStat, localToday, to } from "@/utils";
import { WeekCalendar } from "./WeekCalendar";
import { gamesQueries } from "./gamesQueries";

function NoGames() {
  return <Empty title="해당 날짜의 경기 기록이 없습니다." sub="다른 날짜를 선택해 보세요." />;
}

/** 영상 한 개는 외부 재생 링크로, 여러 개는 경기 상세의 영상 목록으로 연결한다 (서버의 버튼 규칙 actions). */
function HighlightLink({ game: g }: { game: MatchSummary }) {
  if (g.actions.highlightUrl) return <ExternalLink href={g.actions.highlightUrl}>하이라이트</ExternalLink>;
  if (g.actions.highlightList) return <NextLink to={gameUrl(g)}>하이라이트 목록</NextLink>;
  return null;
}

/** 필터가 있을 때만 그 날 전체 경기를 읽어 "조건에 맞는 경기 없음"과 "경기 없음"을 구분한다. */
function EmptyResult({ allDay }: { allDay: ReturnType<typeof matchesQuery> }) {
  const { date } = useUrl();
  const { data } = useSuspenseQuery(allDay);
  return data.length ? (
    <Empty title="조건에 맞는 경기가 없습니다.">
      <NextLink to={to(ROUTES.GAMES, { date })}>필터 초기화</NextLink>
    </Empty>
  ) : (
    <NoGames />
  );
}

/** 날짜·팀·경기 상태 조건에 맞는 일정을 표시하고 경기 상세로 연결한다. */
export function GamesPage() {
  const url = useUrl();
  const { date, get, here } = url;
  const { teamByCode } = useTeams();
  const q = gamesQueries(url, teamByCode(get("team"))?.id ?? "");
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
          statusLabel(g.status),
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
      <WeekCalendar days={q.week} withGames={new Set(weekDates)} />
      <SectionTitle title={displayDate(date, true) + " 경기"}>
        <Count>{rows.length}경기</Count>
      </SectionTitle>
      {body}
    </div>
  );
}
