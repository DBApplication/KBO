import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import type { PlayerSearchItem } from "@/entities/player";
import { teamShort, useTeams } from "@/entities/team";
import { SearchForm } from "@/features/search";
import type { PageResponse } from "@/shared/api";
import { PAGE_SIZE } from "@/shared/config";
import { includes, paging, to, useUrl } from "@/shared/lib";
import { Count, Empty, Heading, Pager, SectionTitle } from "@/shared/ui";
import { searchOf } from "../model/search-query";

const EMPTY: PageResponse<PlayerSearchItem> = { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };

/** 통합 검색어로 팀과 선수를 찾아 각각 순위표와 개인 상세 화면으로 연결한다. */
export function SearchPage() {
  const url = useUrl();
  const { season, page } = url;
  const { q, query } = searchOf(url);
  const { teams: allTeams } = useTeams();
  // 로더가 미리 받아 두므로 검색어가 있으면 첫 렌더부터 데이터가 있다.
  const found = useQuery(query).data ?? EMPTY;
  const players = found.content;
  const teams = q ? allTeams.filter((t) => includes(t.name + (t.shortName ?? ""), q)) : [];
  const { current, pages } = paging(found.totalElements, page);

  return (
    <div className="wrap page">
      <Heading title="검색 결과" sub={q ? "“" + q + "” 검색 결과" : "선수 또는 팀 이름을 입력하세요."} />
      <SearchForm scope="global" value={q} placeholder="선수 또는 팀 검색" />
      {!players.length && !teams.length ? (
        <Empty title={q ? "검색 결과가 없습니다." : "선수·팀 검색"} sub="선수 이름이나 구단명으로 검색해 보세요." />
      ) : null}
      {teams.length ? (
        <>
          <SectionTitle title="팀">
            <Count>{teams.length}팀</Count>
          </SectionTitle>
          {teams.map((t) => (
            <Link key={t.id} className="result" to={to("teams", { team: t.code, season })}>
              <strong>{t.name}</strong>
              <span>팀 기록 →</span>
            </Link>
          ))}
        </>
      ) : null}
      {players.length ? (
        <>
          <SectionTitle title="선수">
            <Count>{found.totalElements}명</Count>
          </SectionTitle>
          {players.map((p) => (
            <Link key={p.id} className="result" to={to("player", { id: p.id, type: p.type === "PITCHER" ? "pit" : "bat" })}>
              <strong>{p.name}</strong>
              <span>
                {teamShort(p.team)} · {p.position} →
              </span>
            </Link>
          ))}
          <Pager current={current} pages={pages} />
        </>
      ) : null}
    </div>
  );
}
