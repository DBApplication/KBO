import type { TeamSummary } from "@/types";

/** 팀의 짧은 표시명 (약칭 → 코드 → —). */
export function teamShort(team: TeamSummary | null | undefined): string {
  return team?.shortName || team?.code || "—";
}
