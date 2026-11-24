import { queryOptions } from "@tanstack/react-query";
import { fetchPlayer, fetchPlayers, type PlayerSearchParams } from "@/api";

export const playersQuery = (params: PlayerSearchParams) =>
  queryOptions({ queryKey: ["players", params], queryFn: () => fetchPlayers(params) });

export const playerQuery = (id: string) => queryOptions({ queryKey: ["player", id], queryFn: () => fetchPlayer(id) });
