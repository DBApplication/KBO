import { rankingQuery, seasonColumns } from "@/entities/record";
import type { Standings } from "@/entities/standing";
import { PAGE_SIZE } from "@/shared/config";
import type { UrlQuery } from "@/shared/lib";

/**
 * 주소 조건 → 선수 기록 API 조건.
 * KBO 기록실처럼 처음에는 규정타석(팀 경기 수 × 3.1)·규정이닝(팀 경기 수 × 1) 이상만 보여 준다.
 * 이름으로 찾을 때는 규정 미달 선수도 나오도록 제한을 풀어 둔다.
 */
export function rankingOf({ kind, season, get, page }: UrlQuery, standings: Standings | null, teamId: number | "") {
  const pit = kind === "pit";
  const cols = seasonColumns(kind);
  const sort = cols.some((c) => c.key === get("sort")) ? get("sort") : pit ? "era" : "avg";
  // 처음에는 타율 높은 순, 투수는 ERA 낮은 순
  const asc = get("dir") ? get("dir") === "asc" : sort === "era";
  const team = get("team");
  const minChoice = get("min", get("q").trim() ? "0" : "q");
  const teamGames = Math.max(
    0,
    ...(standings?.standings ?? []).filter((r) => !team || r.team.code === team).map((r) => r.games ?? 0),
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
      // sort 는 열 정의(서버 정렬 키) 중에서만 고른다
      sort: sort as never,
      order: asc ? "asc" : "desc",
      size: PAGE_SIZE,
      page: page - 1,
    }),
  };
}
