import { ENDPOINTS } from "@/constants";
import { get } from "@/lib";
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

/** GET /api/players?keyword=&teamId=&type=&page=&size= — 선수 검색 */
export const fetchPlayers = (params: PlayerSearchParams) =>
  get<PageResponse<PlayerSearchItem>>(ENDPOINTS.PLAYERS, { ...params });

/** GET /api/players/{id} — 선수 상세 프로필 */
export const fetchPlayer = (id: string | number) => get<PlayerDetail>(ENDPOINTS.PLAYER(id));
