import { Link } from "react-router";
import type { Kind } from "@/shared/config";
import { to, useUrl } from "@/shared/lib";

/** 선수 ID가 확인된 기록만 개인 상세로 연결해 동명이인 기록을 잘못 연결하지 않게 한다. */
export function PlayerLink({ id, name, type }: { id: number | null | undefined; name: string; type?: Kind }) {
  const { season, kind } = useUrl();
  if (!id) return <>{name}</>;
  return (
    <Link className="player-link" to={to("player", { id, type: type || kind, season })}>
      {name}
    </Link>
  );
}
