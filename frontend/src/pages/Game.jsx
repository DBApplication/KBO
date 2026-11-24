import { Link, useLoaderData } from "react-router";
import * as api from "../lib/api.js";
import { displayDate } from "../lib/format.js";
import { formatStat } from "../lib/records.js";
import { requestQuery, to } from "../lib/query.js";
import { useQuery, useReference } from "../hooks.js";
import {
  DataTable,
  Empty,
  ExternalLink,
  Heading,
  NextLink,
  PlayerLink,
  SectionTitle,
} from "../components/common.jsx";
import { KindTabs } from "../components/controls.jsx";
import { batDaily, pitDaily, statuses } from "./match-shared.jsx";

/** 경기 상세: 점수, 영상, 이닝 점수판, 주요 기록, 출전 선수. 없는 경기면 notFound. */
export async function loader({ request }) {
  const { get } = requestQuery(request);
  try {
    return { detail: await api.match(get("id")) };
  } catch (e) {
    if (e instanceof api.ApiError && [400, 404].includes(e.status)) return { notFound: true };
    throw e;
  }
}

/** 경기 ID로 점수, 영상, 이닝별 득점, 주요 기록과 출전 선수를 모아 상세 화면을 만든다. */
export default function Game() {
  const { detail, notFound } = useLoaderData();
  const { kind } = useQuery();
  const { shortTeam } = useReference();
  if (notFound)
    return (
      <div className="wrap">
        <Empty title="경기를 찾을 수 없습니다.">
          <NextLink to={to("games")}>경기 목록</NextLink>
        </Empty>
      </div>
    );

  const { game: g, highlights, scoreboard: board, events } = detail;
  const innings = Array.from({ length: board?.innings || 9 }, (_, i) => i + 1);
  const players = kind === "bat" ? detail.batters : detail.pitchers;
  const cols = kind === "bat" ? batDaily : pitDaily;
  const finished = g.status === "FINISHED";
  /** 스코어보드 한쪽에 홈·원정 구분과 팀 이름을 표시한다. */
  const scoreSide = (s) => (
    <div>
      <small>{s === "away" ? "원정" : "홈"}</small>
      <b>{shortTeam(g[s + "_team_code"])}</b>
    </div>
  );

  return (
    <div className="wrap page">
      <Link className="back" to={to("games", { date: g.match_date })}>
        ‹ 경기 기록
      </Link>
      <Heading
        title={shortTeam(g.away_team_code) + " vs " + shortTeam(g.home_team_code)}
        sub={`${displayDate(g.match_date)} · ${g.match_time || "시각 미정"} · ${g.stadium}`}
      />
      <div className="scoreboard">
        {scoreSide("away")}
        <div>
          <small>{statuses[g.status] || g.status}</small>
          <strong>
            {formatStat("score", g.away_score)} <em>:</em> {formatStat("score", g.home_score)}
          </strong>
        </div>
        {scoreSide("home")}
      </div>

      {g.status === "SCHEDULED" ? <ExternalLink href={g.ticket_url}>예매하기</ExternalLink> : null}
      {highlights.length ? (
        <>
          <SectionTitle title="하이라이트" />
          {highlights.map((v, i) => (
            <div className="video" key={i}>
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
              headers={["선수", "팀", ...cols.map((c) => c[1])]}
              rows={players.map((r) => [
                <PlayerLink id={r.player_id} name={r.player_name} />,
                r.team_name,
                ...cols.map(([k]) => formatStat(k, r[k])),
              ])}
            />
          ) : (
            <Empty title="이 경기의 선수별 기록은 아직 수집되지 않았습니다.">
              <NextLink to={to("players", { season: g.season })}>시즌 기록 보기</NextLink>
            </Empty>
          )}
        </>
      ) : null}
    </div>
  );
}
