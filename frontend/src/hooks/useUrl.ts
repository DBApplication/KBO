import { useLocation, useSearchParams } from "react-router";
import { readQuery, to, type UrlParams, type UrlQuery } from "@/utils";

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
