import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { DataTable, Empty, Heading } from "@/components";
import { CompareCard, type ComparePick, PlayerPicker, compareQuery } from "@/features/compare";
import { KindTabs, SeasonSelect } from "@/features/filters";
import { seasonColumns } from "@/features/record";
import { useRecordSeasons, useUrl } from "@/hooks";
import { formatStat } from "@/utils";

/**
 * 두 값 중 나은 쪽과 그 차이. 한쪽이라도 기록이 없거나 같으면 null 이라 아무 표시도 하지 않는다.
 * ERA·패·자책처럼 낮을수록 좋은 지표는 열 정의의 lowerIsBetter 로 방향을 뒤집는다.
 */
function lead(a: number | string | null, b: number | string | null, lowerIsBetter?: boolean) {
  if (a == null || a === "" || b == null || b === "") return null;
  const [x, y] = [Number(a), Number(b)];
  if (!Number.isFinite(x) || !Number.isFinite(y) || x === y) return null;
  return { leftWins: lowerIsBetter ? x < y : x > y, diff: Math.abs(x - y) };
}

/** 우위 표시. 값과 같은 칸에 두면 숫자 자리가 밀리므로 바깥쪽 별도 칸에 그린다. */
function Lead({ gap }: { gap: string }) {
  return (
    <b className="lead">
      <span aria-hidden="true">▲</span> {gap}
      <span className="sr"> 우위</span>
    </b>
  );
}

/** 두 선수의 같은 시즌 기록을 지표별로 나란히 표시한다. */
export function ComparePage() {
  const url = useUrl();
  const { kind, here } = url;
  const seasons = useRecordSeasons();
  const { data } = useSuspenseQuery(compareQuery(url));
  const navigate = useNavigate();
  const [side, setSide] = useState<"" | "left" | "right">("");
  const pit = kind === "pit";
  const cols = seasonColumns(kind, "compare");
  // 비교 기록이 있으면 카드에는 그 시즌 소속 팀을 보여 준다.
  const [left, right]: (ComparePick | null)[] = data.records
    ? data.records.map((r) => ({ ...r.player, team: r.team }))
    : [data.left, data.right];

  /** 고른 선수를 한쪽에 넣고, 반대쪽 선택은 그대로 주소에 남긴다. */
  const select = (id: number) => navigate(here({ left: data.left?.id, right: data.right?.id, [side]: id }));

  let body;
  if (data.records) {
    const [l, r] = data.records;
    body = (
      <DataTable
        caption="선수 비교"
        className="comparison"
        // 가운데가 비교 항목, 좌우가 두 선수의 값, 맨 바깥이 우위 표시.
        headers={[<span className="sr">우위</span>, l.player.name, "기록", r.player.name, <span className="sr">우위</span>]}
        rows={cols.map((c) => {
          const [lv, rv] = [c.get(l.stats), c.get(r.stats)];
          const d = lead(lv, rv, c.lowerIsBetter);
          const gap = d ? formatStat(d.diff, c.format) : "";
          return [
            d?.leftWins ? <Lead gap={gap} /> : null,
            formatStat(lv, c.format),
            c.label,
            formatStat(rv, c.format),
            d && !d.leftWins ? <Lead gap={gap} /> : null,
          ];
        })}
      />
    );
  } else if (data.left && data.right)
    body = <Empty title="두 선수 중 이 시즌 기록이 없는 선수가 있습니다." sub="시즌을 바꾸거나 다른 선수를 선택해 보세요." />;
  else body = <Empty title="두 선수를 선택하면 비교 기록이 표시됩니다." />;

  return (
    <div className="wrap page">
      <Heading title="선수 비교" sub="같은 시즌, 두 선수의 기록을 나란히 살펴보세요.">
        <SeasonSelect seasons={seasons} />
      </Heading>
      <KindTabs />
      <div className="pair">
        <CompareCard pick={left ?? null} onPick={() => setSide("left")} />
        <CompareCard pick={right ?? null} onPick={() => setSide("right")} />
      </div>
      {body}
      <p className="meta">출전 경기와 {pit ? "이닝" : "타석 수"}가 다릅니다. 누적 기록은 출전 기회와 함께 비교하세요.</p>
      <PlayerPicker
        open={side !== ""}
        excludeId={(side === "left" ? data.right : data.left)?.id}
        onClose={() => setSide("")}
        onSelect={select}
      />
    </div>
  );
}
