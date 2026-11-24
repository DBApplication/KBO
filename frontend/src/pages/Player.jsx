import { Link, useLoaderData, useNavigate } from "react-router";
import * as api from "../lib/api.js";
import { formatStat } from "../lib/records.js";
import { requestQuery, to } from "../lib/query.js";
import { useQuery, useReference } from "../hooks.js";
import { DataTable, Empty, NextLink, Photo, SectionTitle } from "../components/common.jsx";
import { KindTabs } from "../components/controls.jsx";
import { recordKey } from "./season-shared.js";

const detailBat = "avg games pa ab r h 2b 3b hr tb rbi sb cs bb hbp so gdp slg obp e ops".split(" ");
const detailPit = "era games cg sho w l sv hld wpct tbf outs h hr bb hbp so r er".split(" ");
const abbr = { games: "G", outs: "IP", wpct: "WPCT" };

/** 선수 프로필과 연도별 타격·투구 기록. 없는 선수면 notFound. */
export async function loader({ request }) {
  const { get } = requestQuery(request);
  try {
    return { detail: await api.playerDetail(get("id")) };
  } catch (e) {
    if (e instanceof api.ApiError && [400, 404].includes(e.status)) return { notFound: true };
    throw e;
  }
}

/** 목록에서 들어왔으면 뒤로 가서 필터·스크롤을 그대로 되살리고, 주소로 바로 열었으면 목록으로 이동한다. */
function BackLink({ href, children }) {
  const navigate = useNavigate();
  return (
    <Link
      className="back"
      to={href}
      onClick={(e) => {
        if (window.history.state?.idx > 0) {
          e.preventDefault();
          navigate(-1);
        }
      }}
    >
      {children}
    </Link>
  );
}

/** 선수 ID에 해당하는 프로필과 연도별 성적을 표시하며 이적 시즌의 팀별 기록을 구분한다. */
export default function Player() {
  const { detail, notFound } = useLoaderData();
  const { kind, season } = useQuery();
  const { shortTeam } = useReference();
  if (notFound)
    return (
      <div className="wrap">
        <Empty title="선수를 찾을 수 없습니다.">
          <NextLink to={to("players")}>선수 기록 보기</NextLink>
        </Empty>
      </div>
    );

  const p = detail.player;
  const byType = { bat: detail.bat, pit: detail.pit };
  // 주소의 기록 종류에 기록이 없으면 있는 쪽(타격 우선)을 보여 준다.
  const type = byType[kind].length ? kind : byType.bat.length ? "bat" : "pit";
  const bat = type === "bat";
  const keys = bat ? detailBat : detailPit;
  const rows = byType[type]
    .slice()
    .sort((a, b) => Number(b.season) - Number(a.season) || a.team_code.localeCompare(b.team_code));
  const target = rows.find((r) => r.season === season) || rows[0];

  return (
    <div className="wrap page">
      <BackLink href={to("players", { type, season })}>‹ 선수 기록</BackLink>
      <section className="profile">
        <Photo name={p.name} src={p.image_url} />
        <div>
          <p className="meta">선수 프로필</p>
          <h1>{p.name}</h1>
          <p>
            {shortTeam(p.team_code)} · {p.position || "포지션 미제공"} · {p.throw_bat || "투타 미제공"}
          </p>
          <small>마지막 기록상 소속 기준</small>
        </div>
        <dl>
          <dt>생년월일</dt>
          <dd>{p.birth_date || "—"}</dd>
          <dt>신장 / 체중</dt>
          <dd>
            {p.height ? p.height + "cm" : "—"} / {p.weight ? p.weight + "kg" : "—"}
          </dd>
        </dl>
      </section>
      {byType.bat.length && byType.pit.length ? <KindTabs /> : null}
      <SectionTitle title={"연도별 " + (bat ? "타격" : "투구") + " 기록"}>
        {target ? (
          <NextLink
            to={to("compare", { type, season: target.season, left: recordKey(target) })}
          >
            선수 비교
          </NextLink>
        ) : null}
      </SectionTitle>
      {rows.length ? (
        <DataTable
          caption="연도별 선수 기록"
          className="records"
          headers={["연도", "팀명", ...keys.map((k) => abbr[k] || k.toUpperCase())]}
          rows={rows.map((r) => [
            r.season,
            shortTeam(r.team_code),
            ...keys.map((k) => formatStat(type + "_" + k, r[type + "_" + k])),
          ])}
        />
      ) : (
        <Empty title="수집된 시즌 기록이 없습니다." />
      )}
      <p className="meta">팀명은 해당 시즌 기록의 소속팀입니다. 미제공 값은 —로 표시합니다.</p>
    </div>
  );
}
