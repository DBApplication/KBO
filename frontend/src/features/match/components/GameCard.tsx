import { Link } from "react-router";
import { TeamLogo } from "@/components";
import { teamShort } from "@/features/team";
import type { MatchSummary } from "@/types";
import { formatStat, shortDate } from "@/utils";
import { gameUrl } from "../gameUrl";
import { statusLabel } from "../status";

/** 구장, 경기 상태, 홈·원정 점수를 한 장의 경기 카드로 표시한다. showDate 면 경기 날짜도 함께 보여 준다. */
export function GameCard({ game: g, showDate = false }: { game: MatchSummary; showDate?: boolean }) {
  /** 지정한 팀의 점수를 표시하고 종료 경기에서 이긴 팀에 승리 표시를 붙인다. */
  const side = (s: "away" | "home") => {
    const winner = s === "home" ? g.result === "HOME_WIN" : g.result === "AWAY_WIN";
    const team = s === "home" ? g.homeTeam : g.awayTeam;
    return (
      <div className={`scoreline ${winner ? "winner" : ""}`}>
        <span className="team-name">
          <TeamLogo team={team} />
          {teamShort(team)}
          <small>{s === "away" ? "원정" : "홈"}</small>
          {winner ? <b>승</b> : null}
        </span>
        <strong>{formatStat(s === "home" ? g.homeScore : g.awayScore)}</strong>
      </div>
    );
  };
  return (
    <Link className="game-card" to={gameUrl(g)}>
      <div className="card-meta">
        <span>
          {showDate ? <time dateTime={g.matchDate}>{shortDate(g.matchDate)} · </time> : null}
          {g.stadium}
        </span>
        <span>{statusLabel(g.status)}</span>
      </div>
      {side("away")}
      {side("home")}
      <div className="card-bottom">
        경기 기록 <span aria-hidden="true">→</span>
      </div>
    </Link>
  );
}
