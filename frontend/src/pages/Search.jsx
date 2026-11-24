import { Link, useLoaderData } from "react-router";
import * as api from "../lib/api.js";
import { includes } from "../lib/format.js";
import { PAGE_SIZE, paging, requestQuery, to } from "../lib/query.js";
import { useQuery, useReference } from "../hooks.js";
import { Count, Empty, Heading, SectionTitle } from "../components/common.jsx";
import { Pager, SearchForm } from "../components/controls.jsx";

/** 선수는 서버에서 이름으로 찾는다 (팀은 처음 받은 팀 목록에서 화면이 찾는다). */
export async function loader({ request }) {
  const { get, page } = requestQuery(request);
  const q = get("q").trim();
  return {
    found: q ? await api.searchPlayers(q, page - 1, PAGE_SIZE) : { rows: [], total: 0 },
  };
}

/** 통합 검색어로 팀과 선수를 찾아 각각 순위표와 개인 상세 화면으로 연결한다. */
export default function Search() {
  const { found } = useLoaderData();
  const { get, season, page } = useQuery();
  const { teams: allTeams, shortTeam } = useReference();
  const q = get("q").trim();
  const players = found.rows;
  const teams = q ? allTeams.filter((t) => includes(t.name + t.short_name, q)) : [];
  const { current, pages } = paging(found.total, page);

  return (
    <div className="wrap page">
      <Heading
        title="검색 결과"
        sub={q ? "“" + q + "” 검색 결과" : "선수 또는 팀 이름을 입력하세요."}
      />
      <SearchForm scope="global" value={q} placeholder="선수 또는 팀 검색" />
      {!players.length && !teams.length ? (
        <Empty
          title={q ? "검색 결과가 없습니다." : "선수·팀 검색"}
          sub="선수 이름이나 구단명으로 검색해 보세요."
        />
      ) : null}
      {teams.length ? (
        <>
          <SectionTitle title="팀">
            <Count>{teams.length}팀</Count>
          </SectionTitle>
          {teams.map((t) => (
            <Link key={t.code} className="result" to={to("teams", { team: t.code, season })}>
              <strong>{t.name}</strong>
              <span>팀 기록 →</span>
            </Link>
          ))}
        </>
      ) : null}
      {players.length ? (
        <>
          <SectionTitle title="선수">
            <Count>{found.total}명</Count>
          </SectionTitle>
          {players.map((p) => (
            <Link key={p.id} className="result" to={to("player", { id: p.id, type: p.type })}>
              <strong>{p.name}</strong>
              <span>
                {shortTeam(p.team_code)} · {p.position} →
              </span>
            </Link>
          ))}
          <Pager current={current} pages={pages} />
        </>
      ) : null}
    </div>
  );
}
