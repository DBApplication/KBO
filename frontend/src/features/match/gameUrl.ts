import { ROUTES } from "@/constants";
import type { MatchSummary } from "@/types";
import { to } from "@/utils";

/** 더블헤더 경기도 구분할 수 있도록 DB 경기 id를 포함한 상세 주소를 만든다. */
export function gameUrl(g: MatchSummary): string {
  return to(ROUTES.GAME, { id: g.id, date: g.matchDate });
}
