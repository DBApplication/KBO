import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router";
import { isNotFound } from "../api/client.ts";
import { playerHistoryQuery, playerQuery } from "../api/queries.ts";
import type { SeasonRecord } from "../api/types.ts";
import { teamShort, useUrl } from "../hooks.ts";
import { formatStat } from "../lib/format.ts";
import { requestQuery, to } from "../lib/query.ts";
import { seasonColumns, type SeasonStats } from "../lib/stats.ts";
import { DataTable, Empty, NextLink, Photo, SectionTitle } from "../components/common.tsx";
import { KindTabs } from "../components/controls.tsx";

/** 선수 프로필과 연도별 타격·투구 기록. 없는 선수(P001)면 notFound. */
export const loader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const id = requestQuery(request).get("id");
    try {
      await Promise.all([
        qc.ensureQueryData(playerQuery(id)),
        qc.ensureQueryData(playerHistoryQuery("bat", id)),
        qc.ensureQueryData(playerHistoryQuery("pit", id)),
      ]);
      return { notFound: false };
    } catch (e) {
      if (isNotFound(e)) return { notFound: true };
      throw e;
    }
  };

export default function Player() {
  const { notFound } = useLoaderData<{ notFound: boolean }>();
  if (notFound)
    return (
      <div className="wrap">
        <Empty title="선수를 찾을 수 없습니다.">
          <NextLink to={to("players")}>선수 기록 보기</NextLink>
        </Empty>
      </div>
    );
  return <PlayerDetail />;
}

/** 목록에서 들어왔으면 뒤로 가서 필터·스크롤을 그대로 되살리고, 주소로 바로 열었으면 목록으로 이동한다. */
function BackLink({ href, children }: { href: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <Link
      className="back"
      to={href}
      onClick={(e) => {
        if ((window.history.state as { idx?: number } | null)?.idx) {
          e.preventDefault();
          navigate(-1);
        }
      }}
    >
      {children}
    </Link>
  );
}

/** 프로필과 연도별 성적. 이적 시즌은 팀별 기록을 따로 보여 준다. */
function PlayerDetail() {
  const { kind, season, get } = useUrl();
  const id = get("id");
  const { data: p } = useSuspenseQuery(playerQuery(id));
  const { data: batHistory } = useSuspenseQuery(playerHistoryQuery("bat", id));
  const { data: pitHistory } = useSuspenseQuery(playerHistoryQuery("pit", id));
  const byType: Record<"bat" | "pit", SeasonRecord<SeasonStats>[]> = { bat: batHistory, pit: pitHistory };
  // 주소의 기록 종류에 기록이 없으면 있는 쪽(타격 우선)을 보여 준다.
  const type = byType[kind].length ? kind : batHistory.length ? "bat" : "pit";
  const cols = seasonColumns(type, "history");
  const rows = byType[type]
    .slice()
    .sort((a, b) => b.season - a.season || (a.team?.code ?? "").localeCompare(b.team?.code ?? ""));
  const target = rows.find((r) => String(r.season) === season) || rows[0];

  return (
    <div className="wrap page">
      <BackLink href={to("players", { type, season })}>‹ 선수 기록</BackLink>
      <section className="profile">
        <Photo name={p.name} src={p.imageUrl} />
        <div>
          <p className="meta">선수 프로필</p>
          <h1>{p.name}</h1>
          <p>
            {teamShort(p.team)} · {p.position || "포지션 미제공"} · {p.throwBat || "투타 미제공"}
          </p>
          <small>마지막 기록상 소속 기준</small>
        </div>
        <dl>
          <dt>생년월일</dt>
          <dd>{p.birthDate || "—"}</dd>
          <dt>신장 / 체중</dt>
          <dd>
            {p.height ? p.height + "cm" : "—"} / {p.weight ? p.weight + "kg" : "—"}
          </dd>
        </dl>
      </section>
      {batHistory.length && pitHistory.length ? <KindTabs /> : null}
      <SectionTitle title={"연도별 " + (type === "bat" ? "타격" : "투구") + " 기록"}>
        {target ? (
          <NextLink to={to("compare", { type, season: target.season, left: p.id })}>선수 비교</NextLink>
        ) : null}
      </SectionTitle>
      {rows.length ? (
        <DataTable
          caption="연도별 선수 기록"
          className="records"
          headers={["연도", "팀명", ...cols.map((c) => c.label)]}
          rows={rows.map((r) => [
            r.season,
            teamShort(r.team),
            ...cols.map((c) => formatStat(c.get(r.stats), c.format)),
          ])}
        />
      ) : (
        <Empty title="수집된 시즌 기록이 없습니다." />
      )}
      <p className="meta">팀명은 해당 시즌 기록의 소속팀입니다. 미제공 값은 —로 표시합니다.</p>
    </div>
  );
}
