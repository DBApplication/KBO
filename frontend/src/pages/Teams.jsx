import { Link, useLoaderData } from "react-router";
import * as api from "../lib/api.js";
import { formatStat } from "../lib/records.js";
import { requestQuery, to } from "../lib/query.js";
import { useQuery, useReference } from "../hooks.js";
import { DataTable, Empty, Heading, NextLink } from "../components/common.jsx";
import { SeasonSelect } from "../components/controls.jsx";

const columns = ["games", "wins", "losses", "draws", "win_pct", "games_behind", "last10", "streak"];

/** 시즌 기준일의 팀 순위. */
export async function loader({ request }) {
  const { season } = requestQuery(request);
  return { rows: await api.standings(season) };
}

/** 시즌 기준일의 순위를 표시하고 선택한 팀의 최근 10경기 성적과 연속 기록을 보여준다. */
export default function Teams() {
  const { rows } = useLoaderData();
  const { season, get, here } = useQuery();
  const { teamName } = useReference();
  const selected = rows.find((r) => r.team_code === get("team")) || rows[0];

  return (
    <div className="wrap page">
      <Heading title="팀 기록" sub="정규시즌 순위">
        <SeasonSelect />
      </Heading>
      <p className="meta">기준일 {rows[0]?.as_of_date?.replaceAll("-", ".") || "—"}</p>
      {rows.length ? (
        <>
          <DataTable
            caption="정규시즌 팀 순위"
            className="standings"
            headers={["순위", "팀", "경기", "승", "패", "무", "승률", "게임 차", "최근 10경기", "연속"]}
            rowClassName={(i) => (rows[i] === selected ? "chosen" : "")}
            rows={rows.map((r) => [
              r.team_rank,
              <Link className="player-link" to={here({ team: r.team_code })}>
                {teamName(r.team_code)}
              </Link>,
              ...columns.map((k) => formatStat(k, r[k])),
            ])}
          />
          <div className="team-detail">
            <div>
              <h3>{teamName(selected.team_code)}</h3>
              <small>선택한 팀</small>
            </div>
            <p>
              {selected.games}경기 · 게임 차 {selected.games_behind}
            </p>
            <div>
              <span>최근 10경기 {selected.last10}</span>
              <b>{selected.streak}</b>
            </div>
          </div>
          <NextLink to={to("players", { team: selected.team_code, season })}>
            소속 선수 시즌 기록
          </NextLink>
        </>
      ) : (
        <Empty title="해당 시즌의 순위가 없습니다." />
      )}
    </div>
  );
}
