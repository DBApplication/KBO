import { ENDPOINTS } from "@/constants";
import { get, orNullOn404 } from "@/lib";
import type { Standings } from "@/types";

/** GET /api/standings/seasons — 순위 기록이 있는 시즌 (최신순) */
export const fetchStandingSeasons = () => get<number[]>(ENDPOINTS.STANDING_SEASONS);

/** GET /api/standings?season= — 시즌 팀 순위. 그 시즌 순위가 없으면(R002) null */
export const fetchStandings = (season: string | number) =>
  orNullOn404(get<Standings>(ENDPOINTS.STANDINGS, { season }));
