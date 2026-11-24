import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { ENDPOINTS } from "@/constants";
import { getJSON } from "@/lib";
import type { TeamSummary } from "@/types";

/** GET /api/teams */
export const fetchTeams = () => getJSON<TeamSummary[]>(ENDPOINTS.TEAMS);

/** 팀 목록은 바뀌지 않으므로 한 번만 받는다. */
export const teamsQuery = () =>
  queryOptions({ queryKey: ["teams"], queryFn: fetchTeams, staleTime: Infinity });

/** 주소의 팀 코드(team=HT) → API 의 teamId. 코드가 비었거나 모르는 코드면 "" (전체 팀). */
export async function teamIdOf(qc: QueryClient, code: string): Promise<number | ""> {
  if (!code) return "";
  const teams = await qc.ensureQueryData(teamsQuery());
  return teams.find((t) => t.code === code)?.id ?? "";
}
