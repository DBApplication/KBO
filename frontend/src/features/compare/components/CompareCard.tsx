import { TeamLogo } from "@/components";
import { teamShort } from "@/features/team";
import { useUrl } from "@/hooks";
import type { ComparePick } from "../compareQuery";

/** 비교할 한쪽의 선수 정보와 선택 버튼. */
export function CompareCard({ pick, onPick }: { pick: ComparePick | null; onPick: () => void }) {
  const { season } = useUrl();
  return (
    <div className="compare-card">
      <div className="badge">
        <TeamLogo team={pick?.team} size={36} />
      </div>
      <div>
        <h2>{pick ? pick.name : "선수 선택"}</h2>
        <p>{pick ? teamShort(pick.team) + " · " + (pick.position || "포지션 미제공") : "비교할 선수를 선택하세요."}</p>
        {pick ? <small>{season} 시즌 기록</small> : null}
      </div>
      <button onClick={onPick}>{pick ? "선수 변경" : "선수 선택"}</button>
    </div>
  );
}
