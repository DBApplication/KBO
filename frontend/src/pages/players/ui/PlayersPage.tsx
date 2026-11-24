import { useSuspenseQuery } from "@tanstack/react-query";
import { PlayerLink } from "@/entities/player";
import { useRecordSeasons } from "@/entities/record";
import { standingsQuery } from "@/entities/standing";
import { teamShort, useTeams } from "@/entities/team";
import { KindTabs, SeasonSelect, TeamSelect } from "@/features/filters";
import { SearchForm } from "@/features/search";
import { formatStat, paging, to, useUrl } from "@/shared/lib";
import {
  Count,
  DataTable,
  Empty,
  FilterSelect,
  Heading,
  NextLink,
  Pager,
  SectionTitle,
  StatHeader,
} from "@/shared/ui";
import { rankingOf } from "../model/ranking";

/** 시즌별 타자·투수 기록 목록. */
export function PlayersPage() {
  const url = useUrl();
  const { kind, season, get, page } = url;
  const seasons = useRecordSeasons();
  const { teamByCode } = useTeams();
  const { data: standings } = useSuspenseQuery(standingsQuery(season));
  const r = rankingOf(url, standings, teamByCode(get("team"))?.id ?? "");
  const { data: result } = useSuspenseQuery(r.query);
  const pit = kind === "pit";
  const { offset, current, pages } = paging(result.totalElements, page);

  const minOptions: [string, string][] = [];
  if (r.qualified)
    minOptions.push(["q", pit ? `규정이닝 이상 (${r.qualified}이닝)` : `규정타석 이상 (${r.qualified}타석)`]);
  minOptions.push(["0", pit ? "이닝 제한 없음" : "타석 제한 없음"]);
  for (const n of pit ? [10, 50, 100] : [50, 100, 300]) minOptions.push([String(n), n + (pit ? "이닝 이상" : "타석 이상")]);

  return (
    <div className="wrap page">
      <Heading title="선수 기록" sub="시즌별 타자·투수 기록을 확인하세요.">
        <SeasonSelect seasons={seasons} />
      </Heading>
      <KindTabs />
      <div className="toolbar filters">
        <div className="controls">
          <TeamSelect />
          <FilterSelect name="min" label={pit ? "최소 이닝" : "최소 타석"} values={minOptions} selected={r.minChoice} />
        </div>
        <SearchForm scope="local" value={get("q")} placeholder="선수 이름 검색" />
      </div>
      <SectionTitle title={pit ? "투수 기록" : "타자 기록"}>
        <Count>{result.totalElements}개 기록</Count>
      </SectionTitle>
      {result.content.length ? (
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
            rows={result.content.map((item, i) => [
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
