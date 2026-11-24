import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { seasonColumns, useRecordSeasons } from "@/entities/record";
import { KindTabs, SeasonSelect } from "@/features/filters";
import { PlayerPicker } from "./PlayerPicker";
import { formatStat, useUrl } from "@/shared/lib";
import { DataTable, Empty, Heading } from "@/shared/ui";
import { compareQuery, type ComparePick } from "../model/compare-query";
import { CompareCard } from "./CompareCard";

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
        headers={["기록", l.player.name, r.player.name]}
        rows={cols.map((c) => [c.label, formatStat(c.get(l.stats), c.format), formatStat(c.get(r.stats), c.format)])}
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
