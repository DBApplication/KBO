import { DataTable, NextLink, TeamLogo } from "@/components";
import { ROUTES } from "@/constants";
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

const headers = ["순위", "팀", "경기", "승", "패", "무", "승률", "게임 차", "최근 10경기", "연속"];

/**
 * 정규시즌 팀 순위표. withPlayers 를 주면 팀마다 소속 선수 기록으로 가는 버튼을 붙인다
 * (팀 기록 화면에서만. 홈에서는 표만 보여 준다).
 */
export function StandingsTable({
  rows,
  season,
  withPlayers = false,
}: {
  rows: StandingRow[];
  season: string;
  withPlayers?: boolean;
}) {
  return (
    <DataTable
      caption="정규시즌 팀 순위"
      className="standings"
      // 마지막 열은 버튼만 있어 머리글을 보이지 않게 두되, 화면 낭독기에는 읽히도록 남긴다.
      headers={withPlayers ? [...headers, <span className="sr">선수 기록</span>] : headers}
      rows={rows.map((r) => {
        const cells = [
          r.rank,
          <span className="team-name">
            <TeamLogo team={r.team} />
            {r.team.name}
          </span>,
          ...columns.map(([k, f]) => formatStat(r[k], f)),
        ];
        return withPlayers
          ? [
              ...cells,
              <NextLink variant="button" to={to(ROUTES.PLAYERS, { team: r.team.code, season })}>
                선수 기록
              </NextLink>,
            ]
          : cells;
      })}
    />
  );
}
