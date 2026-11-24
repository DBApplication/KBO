import { to } from "@/shared/lib";
import type { MatchSummary } from "../model/types";

/** 더블헤더 경기도 구분할 수 있도록 DB 경기 id를 포함한 상세 주소를 만든다. */
export function gameUrl(g: MatchSummary): string {
  return to("game", { id: g.id, date: g.matchDate });
}
