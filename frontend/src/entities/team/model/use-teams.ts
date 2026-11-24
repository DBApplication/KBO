import { useSuspenseQuery } from "@tanstack/react-query";
import { teamsQuery } from "../api/team-api";

/** 루트 로더가 받아 둔 팀 목록과, 주소의 팀 코드로 팀을 찾는 함수. */
export function useTeams() {
  const { data: teams } = useSuspenseQuery(teamsQuery());
  const byCode = new Map(teams.map((t) => [t.code, t]));
  return { teams, teamByCode: (code: string) => byCode.get(code) };
}
