import { useLoaderData } from "react-router";
import * as api from "../lib/api.js";
import { formatStat } from "../lib/records.js";
import { PAGE_SIZE, paging, requestQuery, to } from "../lib/query.js";
import { useQuery, useReference } from "../hooks.js";
import {
  Count,
  DataTable,
  Empty,
  Heading,
  NextLink,
  PlayerLink,
  SectionTitle,
} from "../components/common.jsx";
import {
  FilterSelect,
  KindTabs,
  Pager,
  SearchForm,
  SeasonSelect,
  StatHeader,
  TeamSelect,
} from "../components/controls.jsx";
import { batCols, pitCols, sortKey } from "./season-shared.js";

/** 주소의 정렬 열과 방향. 처음에는 타율 높은 순, 투수는 ERA 낮은 순. */
function sortOf(kind, get) {
  const pit = kind === "pit";
  const cols = pit ? pitCols : batCols;
  const sort = cols.some(([k]) => k === get("sort")) ? get("sort") : pit ? "pit_era" : "bat_avg";
  const asc = get("dir") ? get("dir") === "asc" : sort === "pit_era";
  return { sort, asc };
}

/** 시즌·팀·이름·최소 출전 조건과 정렬·페이지를 서버(SQL)에 넘겨 선수 기록 목록을 받는다. */
export async function loader({ request }) {
  const { kind, season, get, page } = requestQuery(request);
  const pit = kind === "pit";
  const { sort, asc } = sortOf(kind, get);
  const team = get("team");
  // KBO 기록실처럼 처음에는 규정타석(팀 경기 수 × 3.1)·규정이닝(팀 경기 수 × 1) 이상만 보여 준다.
  // 이름으로 찾을 때는 규정 미달 선수도 나오도록 제한을 풀어 둔다.
  const minChoice = get("min", get("q").trim() ? "0" : "q");
  const [standing, teamId] = await Promise.all([api.standings(season), api.teamId(team)]);
  const teamGames = Math.max(
    0,
    ...standing.filter((r) => !team || r.team_code === team).map((r) => Number(r.games)),
  );
  const qualified = pit ? teamGames : Math.floor(teamGames * 3.1);
  const min = minChoice === "q" ? qualified : Number(minChoice) || 0;
  const params = {
    season,
    teamId,
    keyword: get("q").trim(),
    [pit ? "minInnings" : "minPa"]: min || "",
    sort: sortKey(sort),
    order: asc ? "asc" : "desc",
    size: PAGE_SIZE,
  };
  let result = await api.seasonRanking(kind, { ...params, page: page - 1 });
  // 조건이 바뀌어 요청한 페이지가 범위를 벗어나면 마지막 페이지를 다시 받는다.
  const last = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  if (page > last) result = await api.seasonRanking(kind, { ...params, page: last - 1 });
  return { result, qualified, minChoice };
}

/** 시즌별 타자·투수 기록 목록. */
export default function Players() {
  const { result, qualified, minChoice } = useLoaderData();
  const { kind, season, get, page } = useQuery();
  const { shortTeam } = useReference();
  const pit = kind === "pit";
  const cols = pit ? pitCols : batCols;
  const { sort, asc } = sortOf(kind, get);
  const { offset, current, pages } = paging(result.total, page);

  const minOptions = [
    ...(qualified
      ? [["q", pit ? `규정이닝 이상 (${qualified}이닝)` : `규정타석 이상 (${qualified}타석)`]]
      : []),
    ["0", pit ? "이닝 제한 없음" : "타석 제한 없음"],
    ...(pit ? [10, 50, 100] : [50, 100, 300]).map((n) => [
      String(n),
      n + (pit ? "이닝 이상" : "타석 이상"),
    ]),
  ];

  return (
    <div className="wrap page">
      <Heading title="선수 기록" sub="시즌별 타자·투수 기록을 확인하세요.">
        <SeasonSelect />
      </Heading>
      <KindTabs />
      <div className="toolbar filters">
        <div className="controls">
          <TeamSelect />
          <FilterSelect
            name="min"
            label={pit ? "최소 이닝" : "최소 타석"}
            values={minOptions}
            selected={minChoice}
          />
        </div>
        <SearchForm scope="local" value={get("q")} placeholder="선수 이름 검색" />
      </div>
      <SectionTitle title={pit ? "투수 기록" : "타자 기록"}>
        <Count>{result.total}개 기록</Count>
      </SectionTitle>
      {result.rows.length ? (
        <>
          <DataTable
            caption="시즌 선수 기록"
            className="records"
            headers={[
              "순번",
              "선수",
              "팀",
              ...cols.map(([k, n]) => (
                <StatHeader k={k} label={n} sort={sort} asc={asc} defaultAsc={k === "pit_era"} />
              )),
            ]}
            rows={result.rows.map((r, i) => [
              offset + i + 1,
              <PlayerLink id={r.player_id} name={r.name} />,
              shortTeam(r.team_code),
              ...cols.map(([k]) => formatStat(k, r[k])),
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
