import { Link, useLoaderData } from "react-router";
import * as api from "../lib/api.js";
import { sortRecords } from "../lib/records.js";
import { requestQuery, to } from "../lib/query.js";
import { useQuery } from "../hooks.js";
import { Count, Heading, NextLink, Photo, SectionTitle } from "../components/common.jsx";
import { DateControl } from "../components/controls.jsx";
import { DailyRecords, GameCard, NoGames } from "./match-shared.jsx";

/** 선택한 날짜의 경기 목록과 일별 선수 기록. */
export async function loader({ request }) {
  const { date } = requestQuery(request);
  const [games, records] = await Promise.all([api.matches(date), api.dailyRecords(date)]);
  return { games, records };
}

/** 선택한 날짜의 경기 카드, 일별 선수 기록, 대표 선수 사진을 홈 화면에 배치한다. */
export default function Home() {
  const { games, records } = useLoaderData();
  const { date } = useQuery();
  // 그 날 홈런(동률이면 안타)이 가장 많은 타자를 대표 선수로 보여 준다.
  const featured = sortRecords(
    records.bat.filter((r) => r.player_id),
    "home_runs",
    false,
    "hits",
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
        {featured ? (
          <aside className="home-photo">
            <Link to={to("player", { id: featured.player_id, type: "bat" })}>
              <Photo name={featured.player_name} src={featured.image_url} className="hero-photo" />
              <div className="photo-caption">
                <span>{featured.team_name}</span>
                <strong>{featured.player_name}</strong>
                <span aria-hidden="true">↗</span>
              </div>
            </Link>
          </aside>
        ) : null}
      </div>
    </>
  );
}
