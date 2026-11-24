import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { Link, type LoaderFunctionArgs } from "react-router";
import { dailyRecordsQuery, matchesQuery } from "../api/queries.ts";
import { useUrl } from "../hooks.ts";
import { sortBy } from "../lib/format.ts";
import { requestQuery, to } from "../lib/query.ts";
import { Count, Heading, NextLink, Photo, SectionTitle } from "../components/common.tsx";
import { DateControl } from "../components/controls.tsx";
import { DailyRecords, GameCard, NoGames } from "./match-shared.tsx";

/** 선택한 날짜의 경기 목록과 일별 선수 기록. */
export const loader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const { date } = requestQuery(request);
    await Promise.all([
      qc.ensureQueryData(matchesQuery(date)),
      qc.ensureQueryData(dailyRecordsQuery(date)),
    ]);
    return null;
  };

/** 선택한 날짜의 경기 카드, 일별 선수 기록, 대표 선수 사진을 홈 화면에 배치한다. */
export default function Home() {
  const { date } = useUrl();
  const { data: games } = useSuspenseQuery(matchesQuery(date));
  const { data: records } = useSuspenseQuery(dailyRecordsQuery(date));
  // 그 날 홈런(동률이면 안타)이 가장 많은 타자를 대표 선수로 보여 준다.
  const featured = sortBy(
    records.batters.filter((r) => r.player),
    (r) => r.homeRuns,
    false,
    (r) => r.hits,
  )[0];

  return (
    <>
      <div className="wrap">
        <Heading title="KBO 일별 기록" sub="날짜별 경기 결과와 선수의 기록을 한눈에 확인하세요.">
          <DateControl />
        </Heading>
      </div>
      <section className="scoreband">
        <div className="wrap">
          <SectionTitle title="오늘의 경기">
            <Count>{games.length}경기</Count>
            <NextLink to={to("games", { date })}>일정 전체 보기</NextLink>
          </SectionTitle>
          {games.length ? (
            <div className="cards">
              {games.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          ) : (
            <NoGames />
          )}
        </div>
      </section>
      <div className={`wrap home-body ${featured ? "with-photo" : ""}`}>
        <section>
          <DailyRecords records={records} games={games} />
        </section>
        {featured?.player ? (
          <aside className="home-photo">
            <Link to={to("player", { id: featured.player.id, type: "bat" })}>
              <Photo name={featured.playerName} src={featured.player.imageUrl} className="hero-photo" />
              <div className="photo-caption">
                <span>{featured.team?.shortName}</span>
                <strong>{featured.playerName}</strong>
                <span aria-hidden="true">↗</span>
              </div>
            </Link>
          </aside>
        ) : null}
      </div>
    </>
  );
}
