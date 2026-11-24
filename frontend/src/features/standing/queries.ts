import { queryOptions } from "@tanstack/react-query";
import { fetchStandingSeasons, fetchStandings } from "@/api";

export const standingSeasonsQuery = () =>
  queryOptions({ queryKey: ["standings", "seasons"], queryFn: fetchStandingSeasons, staleTime: Infinity });

export const standingsQuery = (season: string) =>
  queryOptions({ queryKey: ["standings", season], queryFn: () => fetchStandings(season) });
