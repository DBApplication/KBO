import { PAGE_SIZE } from "@/constants";
import { playersQuery } from "@/features/player";
import type { UrlQuery } from "@/utils";

/** 검색어 → 선수 검색 쿼리. 검색어가 없으면 요청하지 않는다 (enabled: false). */
export function searchOf({ get, page }: UrlQuery) {
  const q = get("q").trim();
  return { q, query: { ...playersQuery({ keyword: q, page: page - 1, size: PAGE_SIZE }), enabled: q !== "" } };
}
