import { useSuspenseQuery } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "react-router";
import { recordSeasonsQuery, standingSeasonsQuery, teamsQuery } from "./api/queries.ts";
import type { TeamSummary } from "./api/types.ts";
import { readQuery, to, type UrlQuery, type UrlParams } from "./lib/query.ts";

/** 현재 주소의 조회 조건과, 변경값만 덮어써 같은 화면의 새 주소를 만드는 here() 를 돌려준다. */
export function useUrl(): UrlQuery & { here: (changes: UrlParams) => string } {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const page = pathname.replace(/^\//, "") || "home";
  return {
    ...readQuery(params),
    here: (changes) => to(page, { ...Object.fromEntries(params), ...changes }),
  };
}

/** 팀의 짧은 표시명 (약칭 → 코드 → —). */
export function teamShort(team: TeamSummary | null | undefined): string {
  return team?.shortName || team?.code || "—";
}

/** 루트 로더가 한 번 받아 둔 팀 목록과 시즌 목록. */
export function useReference() {
  const { data: teams } = useSuspenseQuery(teamsQuery());
  const { data: standingSeasons } = useSuspenseQuery(standingSeasonsQuery());
  const { data: recordSeasons } = useSuspenseQuery(recordSeasonsQuery());
  const byCode = new Map(teams.map((t) => [t.code, t]));
  return {
    teams,
    /** 팀 순위가 있는 시즌 (팀 기록 화면) */
    standingSeasons: standingSeasons.map(String),
    /** 선수 기록이 있는 시즌 (선수 기록·비교 화면) */
    recordSeasons: recordSeasons.map(String),
    /** 주소의 팀 코드(team=HT)로 팀을 찾는다. */
    teamByCode: (code: string) => byCode.get(code),
  };
}
