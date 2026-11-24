import type { TeamSummary } from "./team";

/** player/dto/PlayerType — position 이 '투수'면 PITCHER */
export type PlayerType = "BATTER" | "PITCHER";

/** player/dto/PlayerSummary */
export interface PlayerSummary {
  id: number;
  name: string;
  position: string | null;
  imageUrl: string | null;
}

/** player/dto/PlayerDetailResponse */
export interface PlayerDetail {
  id: number;
  name: string;
  type: PlayerType;
  position: string | null;
  /** 예: 우투우타 */
  throwBat: string | null;
  birthDate: string | null;
  /** cm */
  height: number | null;
  /** kg */
  weight: number | null;
  imageUrl: string | null;
  team: TeamSummary | null;
}

/** player/dto/PlayerSearchItem */
export interface PlayerSearchItem {
  id: number;
  name: string;
  type: PlayerType;
  position: string | null;
  imageUrl: string | null;
  team: TeamSummary | null;
}
