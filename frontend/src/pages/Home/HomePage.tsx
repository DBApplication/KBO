import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Carousel, Count, Empty, Heading, NextLink, SectionTitle } from "@/components";
import { ROUTES } from "@/constants";
import { GameCard, recentMatchesQuery } from "@/features/match";
import { StandingsTable, standingsQuery } from "@/features/standing";
import { useUrl } from "@/hooks";
import { to } from "@/utils";

/** 홈에 보여 줄 최근 경기 수 */
export const RECENT_GAMES = 7;

/** 기준 날짜까지의 최근 경기 결과와, 그 시즌의 전체 팀 순위. */
export function HomePage() {
  const { date } = useUrl();
  // 순위는 보고 있는 날짜의 시즌 기준으로 맞춘다.
  const season = date.slice(0, 4);
  const qc = useQueryClient();
  const { data: games } = useSuspenseQuery(recentMatchesQuery(qc, date, RECENT_GAMES));
  const { data: standings } = useSuspenseQuery(standingsQuery(season));
  const rows = standings?.standings ?? [];

  return (
    <>
      <div className="wrap">
        <Heading title="KBO 일별 기록" sub="가장 최근 경기 결과와 팀 순위를 한눈에 확인하세요." />
      </div>
      <section className="scoreband">
        <div className="wrap">
          <SectionTitle title="최근 경기">
            <Count>{games.length}경기</Count>
            <NextLink to={to(ROUTES.GAMES, { date })}>일정 전체 보기</NextLink>
          </SectionTitle>
          {games.length ? (
            <Carousel label="최근 경기">
              {games.map((g) => (
                <GameCard key={g.id} game={g} showDate />
              ))}
            </Carousel>
          ) : (
            <Empty title="최근 30일 동안 경기 기록이 없습니다." sub="경기 기록에서 다른 날짜를 찾아보세요." />
          )}
        </div>
      </section>
      <div className="wrap page">
        <SectionTitle title="전체 팀 순위">
          <Count>{season} 시즌</Count>
          <NextLink to={to(ROUTES.TEAMS, { season })}>팀 기록 전체 보기</NextLink>
        </SectionTitle>
        {rows.length ? (
          <StandingsTable rows={rows} season={season} />
        ) : (
          <Empty title="해당 시즌의 순위가 없습니다." />
        )}
      </div>
    </>
  );
}
