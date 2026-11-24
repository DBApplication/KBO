import { queryOptions } from "@tanstack/react-query";
import { ENDPOINTS } from "@/constants";
import { getJSON, orNullOn404 } from "@/lib";
import type { Standings } from "@/types";

/** GET /api/standings/seasons — 순위 기록이 있는 시즌 (최신순) */
export const fetchStandingSeasons = () => getJSON<number[]>(ENDPOINTS.STANDING_SEASONS);

/** GET /api/standings?season= — 그 시즌 순위가 없으면(R002) null */
export const fetchStandings = (season: string | number) =>
  orNullOn404(getJSON<Standings>(ENDPOINTS.STANDINGS, { season }));

export const standingSeasonsQuery = () =>
  queryOptions({ queryKey: ["standings", "seasons"], queryFn: fetchStandingSeasons, staleTime: Infinity });

export const standingsQuery = (season: string) =>
  queryOptions({ queryKey: ["standings", season], queryFn: () => fetchStandings(season) });

