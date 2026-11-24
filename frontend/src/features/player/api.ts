import { queryOptions } from "@tanstack/react-query";
import { ENDPOINTS } from "@/constants";
import { getJSON } from "@/lib";
import type { PageResponse, PlayerDetail, PlayerSearchItem, PlayerType } from "@/types";

export interface PlayerSearchParams {
  keyword?: string;
  teamId?: number | "";
  type?: PlayerType;
  /** 0부터 */
  page?: number;
  /** 최대 100 */
  size?: number;
}

/** GET /api/players?keyword=&teamId=&type=&page=&size= */
export const fetchPlayers = (params: PlayerSearchParams) =>
  getJSON<PageResponse<PlayerSearchItem>>(ENDPOINTS.PLAYERS, { ...params });

/** GET /api/players/{id} */
export const fetchPlayer = (id: string | number) =>
  getJSON<PlayerDetail>(ENDPOINTS.PLAYER(id));

export const playersQuery = (params: PlayerSearchParams) =>
  queryOptions({ queryKey: ["players", params], queryFn: () => fetchPlayers(params) });

export const playerQuery = (id: string) =>
  queryOptions({ queryKey: ["player", id], queryFn: () => fetchPlayer(id) });
