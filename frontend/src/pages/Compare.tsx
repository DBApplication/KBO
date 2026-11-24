import { useEffect, useRef, useState } from "react";
import {
  keepPreviousData,
  queryOptions,
  useQuery,
  useSuspenseQuery,
  type QueryClient,
} from "@tanstack/react-query";
import { useNavigate, type LoaderFunctionArgs } from "react-router";
import { fetchComparison, fetchPlayer, fetchRanking } from "../api/client.ts";
import { choicesQuery } from "../api/queries.ts";
import type { Kind, TeamSummary } from "../api/types.ts";
import { teamShort, useUrl, useReference } from "../hooks.ts";
import { formatStat } from "../lib/format.ts";
import { requestQuery, type UrlQuery } from "../lib/query.ts";
import { seasonColumns } from "../lib/stats.ts";
import { DataTable, Empty, Heading, SectionTitle } from "../components/common.tsx";
import { KindTabs, SeasonSelect } from "../components/controls.tsx";

/** 비교 카드에 보여 줄 선수 */
interface Pick {
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
function compareQuery({ kind, season, get, params }: UrlQuery) {
  const left = get("left");
  const right = get("right");
  const explicit = params.has("left") || params.has("right");
  return queryOptions({
    queryKey: ["compare", kind, season, explicit ? [left, right] : "default"],
    queryFn: async () => {
      /** 선수 id 로 프로필을 찾는다. 없는 선수면 비워 둔다. */
      const byId = async (id: string): Promise<Pick | undefined> => {
        if (!id) return undefined;
        try {
          const p = await fetchPlayer(id);
          return { id: p.id, name: p.name, position: p.position, team: p.team };
        } catch {
          return undefined;
        }
      };
      /** 기본 비교 선수의 이름으로 그 시즌 기록을 찾는다. */
      const byName = async (name: string): Promise<Pick | undefined> => {
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

export const loader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    await qc.ensureQueryData(compareQuery(requestQuery(request)));
    return null;
  };

/** 비교할 한쪽의 선수 정보와 선택 버튼. */
function CompareCard({ pick, onPick }: { pick: Pick | null; onPick: () => void }) {
  const { season } = useUrl();
  return (
    <div className="compare-card">
      <div className="badge">{pick?.team?.code || "—"}</div>
      <div>
        <h2>{pick ? pick.name : "선수 선택"}</h2>
        <p>
          {pick
            ? teamShort(pick.team) + " · " + (pick.position || "포지션 미제공")
            : "비교할 선수를 선택하세요."}
        </p>
        {pick ? <small>{season} 시즌 기록</small> : null}
      </div>
      <button onClick={onPick}>{pick ? "선수 변경" : "선수 선택"}</button>
    </div>
  );
}

/** 입력이 멈추고 delay 뒤의 값. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** 이름으로 비교 후보를 서버에서 찾아 고르는 창. 반대쪽에 이미 선택된 선수는 고를 수 없다. */
function Picker({
  side,
  other,
  onClose,
  onSelect,
}: {
  side: "" | "left" | "right";
  other: Pick | null;
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { kind, season } = useUrl();
  const [text, setText] = useState("");
  const keyword = useDebounced(text, 200);
  // 입력하는 동안에는 이전 결과를 그대로 보여 준다.
  const choices = useQuery({
    ...choicesQuery(kind, season, keyword),
    enabled: side !== "",
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const dialog = ref.current!;
    if (side) {
      setText("");
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [side]);

  const rows = choices.data?.content;
  return (
    <dialog
      ref={ref}
      aria-labelledby="picker-title"
      onClose={onClose}
      // 창 바깥(배경)을 누르면 닫는다.
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      {side ? (
        <>
          <SectionTitle title={<span id="picker-title">비교할 선수 선택</span>}>
            <button aria-label="닫기" onClick={() => ref.current?.close()}>
              닫기
            </button>
          </SectionTitle>
          <input
            type="search"
            aria-label="선수 또는 팀 이름"
            placeholder="선수 또는 팀 이름"
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="pick-list">
            {choices.isError ? (
              <Empty title="선수 목록을 불러오지 못했습니다." />
            ) : rows && !rows.length ? (
              <Empty title="조건에 맞는 선수가 없습니다." />
            ) : (
              (rows ?? []).map(({ player, team }) => {
                const same = other?.id === player.id;
                return (
                  <button
                    key={player.id}
                    disabled={same}
                    onClick={() => {
                      ref.current?.close();
                      onSelect(player.id);
                    }}
                  >
                    <strong>{player.name}</strong>
                    <span>
                      {teamShort(team)} · {same ? "이미 선택됨" : player.position || "포지션 미제공"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      ) : null}
    </dialog>
  );
}

/** 두 선수의 같은 시즌 기록을 지표별로 나란히 표시한다. */
export default function Compare() {
  const url = useUrl();
  const { kind, here } = url;
  const { recordSeasons } = useReference();
  const { data } = useSuspenseQuery(compareQuery(url));
  const navigate = useNavigate();
  const [side, setSide] = useState<"" | "left" | "right">("");
  const pit = kind === "pit";
  const cols = seasonColumns(kind, "compare");
  // 비교 기록이 있으면 카드에는 그 시즌 소속 팀을 보여 준다.
  const [left, right] = data.records
    ? data.records.map((r): Pick => ({ ...r.player, team: r.team }))
    : [data.left, data.right];

  /** 고른 선수를 한쪽에 넣고, 반대쪽 선택은 그대로 주소에 남긴다. */
  const select = (id: number) =>
    navigate(here({ left: data.left?.id, right: data.right?.id, [side]: id }));

  let body;
  if (data.records) {
    const [l, r] = data.records;
    body = (
      <DataTable
        caption="선수 비교"
        className="comparison"
        headers={["기록", l.player.name, r.player.name]}
        rows={cols.map((c) => [c.label, formatStat(c.get(l.stats), c.format), formatStat(c.get(r.stats), c.format)])}
      />
    );
  } else if (data.left && data.right)
    body = (
      <Empty
        title="두 선수 중 이 시즌 기록이 없는 선수가 있습니다."
        sub="시즌을 바꾸거나 다른 선수를 선택해 보세요."
      />
    );
  else body = <Empty title="두 선수를 선택하면 비교 기록이 표시됩니다." />;

  return (
    <div className="wrap page">
      <Heading title="선수 비교" sub="같은 시즌, 두 선수의 기록을 나란히 살펴보세요.">
        <SeasonSelect seasons={recordSeasons} />
      </Heading>
      <KindTabs />
      <div className="pair">
        <CompareCard pick={left ?? null} onPick={() => setSide("left")} />
        <CompareCard pick={right ?? null} onPick={() => setSide("right")} />
      </div>
      {body}
      <p className="meta">
        출전 경기와 {pit ? "이닝" : "타석 수"}가 다릅니다. 누적 기록은 출전 기회와 함께 비교하세요.
      </p>
      <Picker
        side={side}
        other={side === "left" ? data.right : data.left}
        onClose={() => setSide("")}
        onSelect={select}
      />
    </div>
  );
}
