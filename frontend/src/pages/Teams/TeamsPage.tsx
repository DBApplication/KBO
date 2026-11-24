import { useSuspenseQuery } from "@tanstack/react-query";
import { Empty, Heading } from "@/components";
import { SeasonSelect } from "@/features/filters";
import { StandingsTable, standingsQuery } from "@/features/standing";
import { useStandingSeasons, useUrl } from "@/hooks";

/** 시즌 기준일의 정규시즌 순위를 표시하고, 팀별로 소속 선수 기록으로 연결한다. */
export function TeamsPage() {
  const { season } = useUrl();
  const seasons = useStandingSeasons();
  const { data } = useSuspenseQuery(standingsQuery(season));
  const rows = data?.standings ?? [];

  return (
    <div className="wrap page">
      <Heading title="팀 기록" sub="정규시즌 순위">
        <SeasonSelect seasons={seasons} />
      </Heading>
      <p className="meta">기준일 {data?.asOfDate.replaceAll("-", ".") || "—"}</p>
      {rows.length ? (
        <StandingsTable rows={rows} season={season} withPlayers />
      ) : (
        <Empty title="해당 시즌의 순위가 없습니다." />
      )}
    </div>
  );
}
