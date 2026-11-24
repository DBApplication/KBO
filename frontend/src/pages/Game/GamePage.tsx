import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useLoaderData } from "react-router";
import { DataTable, Empty, ExternalLink, Heading, NextLink, SectionTitle, TeamLogo } from "@/components";
import { ROUTES } from "@/constants";
import { KindTabs } from "@/features/filters";
import { gameColumns, matchQuery, statusLabel } from "@/features/match";
import { PlayerLink } from "@/features/player";
import { teamShort } from "@/features/team";
import { useUrl } from "@/hooks";
import type { GameRecord } from "@/types";
import { displayDate, formatStat, to } from "@/utils";

export function GamePage() {
  const { notFound } = useLoaderData<{ notFound: boolean }>();
  if (notFound)
    return (
      <div className="wrap">
        <Empty title="경기를 찾을 수 없습니다.">
          <NextLink to={to(ROUTES.GAMES)}>경기 목록</NextLink>
        </Empty>
      </div>
    );
  return <GameDetail />;
}

/** 점수, 영상, 이닝별 득점, 주요 기록과 출전 선수. */
function GameDetail() {
  const { kind, get } = useUrl();
  const { data: detail } = useSuspenseQuery(matchQuery(get("id")));
  const { match: g, highlights, scoreboard: board, events } = detail;
  const innings = Array.from({ length: board?.innings || 9 }, (_, i) => i + 1);
  const players: GameRecord[] = kind === "bat" ? detail.batters : detail.pitchers;
  const cols = gameColumns(kind);
  const finished = g.status === "FINISHED";
  /** 스코어보드 한쪽에 홈·원정 구분과 팀 이름을 표시한다. */
  const scoreSide = (s: "away" | "home") => (
    <div>
      <TeamLogo team={s === "away" ? g.awayTeam : g.homeTeam} size={44} />
      <b>{teamShort(s === "away" ? g.awayTeam : g.homeTeam)}</b>
      <small>{s === "away" ? "원정" : "홈"}</small>
    </div>
  );

  return (
    <div className="wrap page">
      <Link className="back" to={to(ROUTES.GAMES, { date: g.matchDate })}>
        경기 기록
      </Link>
      <Heading
        title={teamShort(g.awayTeam) + " vs " + teamShort(g.homeTeam)}
        sub={`${displayDate(g.matchDate)} · ${g.matchTime?.slice(0, 5) || "시각 미정"} · ${g.stadium ?? ""}`}
      />
      <div className="scoreboard">
        {scoreSide("away")}
        <div>
          <small>{statusLabel(g.status)}</small>
          <strong>
            {formatStat(g.awayScore)} <em>:</em> {formatStat(g.homeScore)}
          </strong>
        </div>
        {scoreSide("home")}
      </div>

      {g.status === "SCHEDULED" ? <ExternalLink href={g.actions.ticketUrl}>예매하기</ExternalLink> : null}
      {highlights.length ? (
        <>
          <SectionTitle title="하이라이트" />
          {highlights.map((v) => (
            <div className="video" key={v.id}>
              <ExternalLink href={v.url}>{v.title}</ExternalLink>
            </div>
          ))}
        </>
      ) : null}

      {finished ? (
        <>
          <SectionTitle title="이닝별 기록" />
          {board ? (
            <DataTable
              caption="이닝별 득점"
              className="linescore"
              headers={["팀", ...innings, "R", "H", "E"]}
              rows={[board.away, board.home].map((line) => [
                line.team?.shortName,
                ...innings.map((i) => line.scores[i - 1] ?? "—"),
                line.runs,
                line.hits,
                line.errors,
              ])}
            />
          ) : (
            <Empty title="이 경기의 이닝별 기록은 아직 수집되지 않았습니다." />
          )}
        </>
      ) : null}

      {events.length ? (
        <>
          <SectionTitle title="경기 주요 기록" />
          <DataTable
            caption="경기 주요 기록"
            className="events"
            headers={["항목", "기록"]}
            rows={events.map((e) => [e.type, e.description])}
          />
        </>
      ) : null}

      {finished ? (
        <>
          <SectionTitle title="출전 선수 기록" />
          <KindTabs />
          {players.length ? (
            <DataTable
              caption="출전 선수 기록"
              headers={["선수", "팀", ...cols.map((c) => c.label)]}
              rows={players.map((r) => [
                <PlayerLink id={r.player?.id} name={r.playerName} />,
                r.team?.shortName,
                ...cols.map((c) => formatStat(c.get(r), c.format)),
              ])}
            />
          ) : (
            <Empty title="이 경기의 선수별 기록은 아직 수집되지 않았습니다.">
              <NextLink to={to(ROUTES.PLAYERS, { season: g.season })}>시즌 기록 보기</NextLink>
            </Empty>
          )}
        </>
      ) : null}
    </div>
  );
}
