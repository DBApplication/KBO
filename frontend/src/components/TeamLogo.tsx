import { useState } from "react";
import type { TeamSummary } from "@/types";
import { safeLink } from "@/utils";

/** 팀 엠블럼. 주소가 없거나 불러오지 못하면 아무것도 그리지 않는다 (팀명은 옆 글자로 보인다). */
export function TeamLogo({ team, size = 20 }: { team: TeamSummary | null | undefined; size?: number }) {
  const [failed, setFailed] = useState(false);
  const src = safeLink(team?.logoUrl);
  if (!src || failed) return null;
  return (
    <img
      className="team-logo"
      src={src}
      width={size}
      height={size}
      alt=""
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
