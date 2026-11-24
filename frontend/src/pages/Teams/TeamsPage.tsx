import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { DataTable, Empty, Heading, NextLink, TeamLogo } from "@/components";
import { ROUTES } from "@/constants";
import { SeasonSelect } from "@/features/filters";
import { standingsQuery } from "@/features/standing";
import { useStandingSeasons, useUrl } from "@/hooks";
import type { StandingRow, StatFormat } from "@/types";
import { formatStat, to } from "@/utils";

const columns: [keyof StandingRow, StatFormat?][] = [
  ["games"],
  ["wins"],
  ["losses"],
  ["draws"],
  ["winPct", "rate"],
  ["gamesBehind"],
  ["last10"],
  ["streak"],
];

/** 시즌 기준일의 순위를 표시하고 선택한 팀의 최근 10경기 성적과 연속 기록을 보여준다. */
export function TeamsPage() {
  const { season, get, here } = useUrl();
  const seasons = useStandingSeasons();
  const { data } = useSuspenseQuery(standingsQuery(season));
  const rows = data?.standings ?? [];
  const selected = rows.find((r) => r.team.code === get("team")) || rows[0];

  return (
    <div className="wrap page">
      <Heading title="팀 기록" sub="정규시즌 순위">
        <SeasonSelect seasons={seasons} />
      </Heading>
      <p className="meta">기준일 {data?.asOfDate.replaceAll("-", ".") || "—"}</p>
      {selected ? (
        <>
          <DataTable
            caption="정규시즌 팀 순위"
            className="standings"
            headers={["순위", "팀", "경기", "승", "패", "무", "승률", "게임 차", "최근 10경기", "연속"]}
            rowClassName={(i) => (rows[i] === selected ? "chosen" : "")}
            rows={rows.map((r) => [
              r.rank,
              <Link className="player-link team-name" to={here({ team: r.team.code })}>
                <TeamLogo team={r.team} />
                {r.team.name}
              </Link>,
              ...columns.map(([k, f]) => formatStat(r[k], f)),
            ])}
          />
          <div className="team-detail">
            <div>
              <h3>{selected.team.name}</h3>
              <small>선택한 팀</small>
            </div>
            <p>
              {selected.games}경기 · 게임 차 {selected.gamesBehind}
            </p>
            <div>
              <span>최근 10경기 {selected.last10}</span>
              <b>{selected.streak}</b>
            </div>
          </div>
          <NextLink to={to(ROUTES.PLAYERS, { team: selected.team.code, season })}>소속 선수 시즌 기록</NextLink>
        </>
      ) : (
        <Empty title="해당 시즌의 순위가 없습니다." />
      )}
    </div>
  );
}
