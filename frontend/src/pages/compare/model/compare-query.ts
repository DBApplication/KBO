import { queryOptions } from "@tanstack/react-query";
import { fetchPlayer } from "@/entities/player";
import { fetchComparison, fetchRanking } from "@/entities/record";
import type { TeamSummary } from "@/entities/team";
import type { Kind } from "@/shared/config";
import type { UrlQuery } from "@/shared/lib";

/** 비교 카드에 보여 줄 선수 */
export interface ComparePick {
  id: number;
  name: string;
  position: string | null;
  team: TeamSummary | null;
}

/** 주소에 선수가 없을 때 보여 주는 기본 비교 쌍 */
const DEFAULT_PAIR: Record<Kind, [string, string]> = {
  bat: ["김도영", "구자욱"],
  pit: ["원태인", "김택연"],
};

/**
 * 비교 화면 데이터: 주소(left·right = 선수 id)의 두 선수, 없으면 기본 쌍을 이름으로 찾는다.
 * 두 선수가 정해지면 같은 시즌 기록을 비교 API 로 받는다 (한쪽이라도 기록이 없으면 records = null).
 */
export function compareQuery({ kind, season, get, params }: UrlQuery) {
  const left = get("left");
  const right = get("right");
  const explicit = params.has("left") || params.has("right");
  return queryOptions({
    queryKey: ["compare", kind, season, explicit ? [left, right] : "default"],
    queryFn: async () => {
      /** 선수 id 로 프로필을 찾는다. 없는 선수면 비워 둔다. */
      const byId = async (id: string): Promise<ComparePick | undefined> => {
        if (!id) return undefined;
        try {
          const p = await fetchPlayer(id);
          return { id: p.id, name: p.name, position: p.position, team: p.team };
        } catch {
          return undefined;
        }
      };
      /** 기본 비교 선수의 이름으로 그 시즌 기록을 찾는다. */
      const byName = async (name: string): Promise<ComparePick | undefined> => {
        const page = await fetchRanking(kind, { season, keyword: name, sort: "name", order: "asc", size: 100, page: 0 });
        const item = page.content.find((r) => r.player.name === name);
        return item && { ...item.player, team: item.team };
      };
      const [l, found] = explicit
        ? await Promise.all([byId(left), byId(right)])
        : await Promise.all(DEFAULT_PAIR[kind].map(byName));
      const r = found?.id === l?.id ? undefined : found;
      const records = l && r ? await fetchComparison(kind, season, [l.id, r.id]) : null;
      return { left: l ?? null, right: r ?? null, records };
    },
  });
}
