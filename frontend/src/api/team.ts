import { ENDPOINTS } from "@/constants";
import { get } from "@/lib";
import type { TeamSummary } from "@/types";

/** GET /api/teams — 팀 목록 (필터 드롭다운·팀명 표시) */
export const fetchTeams = () => get<TeamSummary[]>(ENDPOINTS.TEAMS);
