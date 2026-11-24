import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { rankingQuery, standingsQuery, teamIdOf } from "../api/queries.ts";
import type { Standings } from "../api/types.ts";
import { teamShort, useUrl, useReference } from "../hooks.ts";
import { formatStat } from "../lib/format.ts";
import { PAGE_SIZE, paging, requestQuery, to, type UrlQuery } from "../lib/query.ts";
import { seasonColumns } from "../lib/stats.ts";
import {
  Count,
  DataTable,
  Empty,
  Heading,
  NextLink,
  PlayerLink,
  SectionTitle,
} from "../components/common.tsx";
import {
  FilterSelect,
  KindTabs,
  Pager,
  SearchForm,
  SeasonSelect,
  StatHeader,
  TeamSelect,
} from "../components/controls.tsx";

/**
 * 주소 조건 → 선수 기록 API 조건.
 * KBO 기록실처럼 처음에는 규정타석(팀 경기 수 × 3.1)·규정이닝(팀 경기 수 × 1) 이상만 보여 준다.
 * 이름으로 찾을 때는 규정 미달 선수도 나오도록 제한을 풀어 둔다.
 */
function rankingOf({ kind, season, get, page }: UrlQuery, standings: Standings | null, teamId: number | "") {
  const pit = kind === "pit";
  const cols = seasonColumns(kind);
  const sort = cols.some((c) => c.key === get("sort")) ? get("sort") : pit ? "era" : "avg";
  // 처음에는 타율 높은 순, 투수는 ERA 낮은 순
  const asc = get("dir") ? get("dir") === "asc" : sort === "era";
  const team = get("team");
  const minChoice = get("min", get("q").trim() ? "0" : "q");
  const teamGames = Math.max(
    0,
    ...(standings?.standings ?? [])
      .filter((r) => !team || r.team.code === team)
      .map((r) => r.games ?? 0),
  );
  const qualified = pit ? teamGames : Math.floor(teamGames * 3.1);
  const min = minChoice === "q" ? qualified : Number(minChoice) || 0;
  return {
    cols,
    sort,
    asc,
    qualified,
    minChoice,
    query: rankingQuery(kind, {
      season,
      teamId,
      keyword: get("q").trim(),
      [pit ? "minInnings" : "minPa"]: min || "",
      sort: sort as never,
      order: asc ? "asc" : "desc",
      size: PAGE_SIZE,
      page: page - 1,
    }),
  };
}

/** 시즌·팀·이름·최소 출전 조건과 정렬·페이지를 서버(SQL)에 넘겨 선수 기록 목록을 받는다. */
export const loader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const query = requestQuery(request);
    const [standings, teamId] = await Promise.all([
      qc.ensureQueryData(standingsQuery(query.season)),
      teamIdOf(qc, query.get("team")),
    ]);
    const result = await qc.ensureQueryData(rankingOf(query, standings, teamId).query);
    // 조건이 바뀌어 요청한 페이지가 범위를 벗어나면 마지막 페이지로 옮긴다.
    const last = Math.max(1, result.totalPages);
    if (query.page > last) {
      const url = new URL(request.url);
      url.searchParams.set("page", String(last));
      throw redirect(url.pathname + url.search);
    }
    return null;
  };

/** 시즌별 타자·투수 기록 목록. */
export default function Players() {
  const query = useUrl();
  const { kind, season, get, page } = query;
  const { recordSeasons, teamByCode } = useReference();
  const { data: standings } = useSuspenseQuery(standingsQuery(season));
  const r = rankingOf(query, standings, teamByCode(get("team"))?.id ?? "");
  const { data: result } = useSuspenseQuery(r.query);
  const rows = result.content;
  const pit = kind === "pit";
  const { offset, current, pages } = paging(result.totalElements, page);

  const minOptions: [string, string][] = [
    ...(r.qualified
      ? [["q", pit ? `규정이닝 이상 (${r.qualified}이닝)` : `규정타석 이상 (${r.qualified}타석)`] as [string, string]]
      : []),
    ["0", pit ? "이닝 제한 없음" : "타석 제한 없음"],
    ...(pit ? [10, 50, 100] : [50, 100, 300]).map((n): [string, string] => [
      String(n),
      n + (pit ? "이닝 이상" : "타석 이상"),
    ]),
  ];

  return (
    <div className="wrap page">
      <Heading title="선수 기록" sub="시즌별 타자·투수 기록을 확인하세요.">
        <SeasonSelect seasons={recordSeasons} />
      </Heading>
      <KindTabs />
      <div className="toolbar filters">
        <div className="controls">
          <TeamSelect />
          <FilterSelect
            name="min"
            label={pit ? "최소 이닝" : "최소 타석"}
            values={minOptions}
            selected={r.minChoice}
          />
        </div>
        <SearchForm scope="local" value={get("q")} placeholder="선수 이름 검색" />
      </div>
      <SectionTitle title={pit ? "투수 기록" : "타자 기록"}>
        <Count>{result.totalElements}개 기록</Count>
      </SectionTitle>
      {rows.length ? (
        <>
          <DataTable
            caption="시즌 선수 기록"
            className="records"
            headers={[
              "순번",
              "선수",
              "팀",
              ...r.cols.map((c) => (
                <StatHeader k={c.key} label={c.label} sort={r.sort} asc={r.asc} defaultAsc={c.key === "era"} />
              )),
            ]}
            rows={rows.map((item, i) => [
              offset + i + 1,
              <PlayerLink id={item.player.id} name={item.player.name} />,
              teamShort(item.team),
              ...r.cols.map((c) => formatStat(c.get(item.stats), c.format)),
            ])}
          />
          <Pager current={current} pages={pages} />
        </>
      ) : (
        <Empty title="조건에 맞는 선수가 없습니다." sub="팀 또는 선수 이름을 변경해 보세요.">
          <NextLink to={to("players", { type: kind, season })}>필터 초기화</NextLink>
        </Empty>
      )}
    </div>
  );
}
