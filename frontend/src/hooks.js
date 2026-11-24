import { useLocation, useRouteLoaderData, useSearchParams } from "react-router";
import { readQuery, to } from "./lib/query.js";

/** 현재 주소의 조회 조건과, 변경값만 덮어써 같은 화면의 새 주소를 만드는 here() 를 돌려준다. */
export function useQuery() {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const page = pathname.replace(/^\//, "") || "home";
  return {
    ...readQuery(params),
    here: (changes) =>
      to(page, { ...Object.fromEntries(params), ...changes }),
  };
}

/** 루트 로더가 한 번 받아 둔 팀·시즌 목록과 팀 코드 조회 함수. */
export function useReference() {
  const ref = useRouteLoaderData("root");
  return {
    ...ref,
    /** 팀 코드에서 구단의 짧은 표시명을 찾는다. */
    shortTeam: (code) => ref.team.get(code)?.short_name || code || "—",
    /** 팀 코드에서 구단의 정식 이름을 찾는다. */
    teamName: (code) => ref.team.get(code)?.name || code,
  };
}
