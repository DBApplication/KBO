import { FilterSelect } from "@/components";
import { useTeams, useUrl } from "@/hooks";

/** 전체 팀과 개별 구단을 선택할 수 있는 팀 필터 (주소에는 팀 코드). */
export function TeamSelect() {
  const { teams } = useTeams();
  const { get } = useUrl();
  const values: [string, string][] = [["", "전체 팀"]];
  for (const t of teams) if (t.code) values.push([t.code, t.name]);
  return <FilterSelect name="team" label="팀 필터" values={values} selected={get("team")} />;
}
