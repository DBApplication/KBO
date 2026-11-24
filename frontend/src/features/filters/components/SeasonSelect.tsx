import { FilterSelect } from "@/components";
import { useUrl } from "@/hooks";

/** 시즌 선택기. seasons 는 그 화면에 기록이 있는 시즌 목록. */
export function SeasonSelect({ seasons }: { seasons: string[] }) {
  const { season } = useUrl();
  return (
    <FilterSelect
      name="season"
      label="시즌"
      values={seasons.map((s): [string, string] => [s, s + " 시즌"])}
      selected={season}
    />
  );
}
