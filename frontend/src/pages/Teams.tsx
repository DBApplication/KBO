import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { Link, type LoaderFunctionArgs } from "react-router";
import { standingsQuery } from "../api/queries.ts";
import type { StandingRow } from "../api/types.ts";
import { useUrl, useReference } from "../hooks.ts";
import { formatStat, type StatFormat } from "../lib/format.ts";
import { requestQuery, to } from "../lib/query.ts";
import { DataTable, Empty, Heading, NextLink } from "../components/common.tsx";
import { SeasonSelect } from "../components/controls.tsx";

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

/** 시즌 기준일의 팀 순위. */
export const loader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    await qc.ensureQueryData(standingsQuery(requestQuery(request).season));
    return null;
  };

/** 시즌 기준일의 순위를 표시하고 선택한 팀의 최근 10경기 성적과 연속 기록을 보여준다. */
export default function Teams() {
  const { season, get, here } = useUrl();
  const { standingSeasons } = useReference();
  const { data } = useSuspenseQuery(standingsQuery(season));
  const rows = data?.standings ?? [];
  const selected = rows.find((r) => r.team.code === get("team")) || rows[0];

  return (
    <div className="wrap page">
      <Heading title="팀 기록" sub="정규시즌 순위">
        <SeasonSelect seasons={standingSeasons} />
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
              <Link className="player-link" to={here({ team: r.team.code })}>
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
          <NextLink to={to("players", { team: selected.team.code, season })}>소속 선수 시즌 기록</NextLink>
        </>
      ) : (
        <Empty title="해당 시즌의 순위가 없습니다." />
      )}
    </div>
  );
}
