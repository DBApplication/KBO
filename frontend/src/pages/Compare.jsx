import { useEffect, useRef, useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import * as api from "../lib/api.js";
import { formatStat } from "../lib/records.js";
import { requestQuery } from "../lib/query.js";
import { useQuery, useReference } from "../hooks.js";
import { DataTable, Empty, Heading, SectionTitle } from "../components/common.jsx";
import { KindTabs, SeasonSelect } from "../components/controls.jsx";
import { choices, pitCols, recordKey } from "./season-shared.js";

const batCompare = [
  ["bat_games", "경기"],
  ["bat_pa", "타석"],
  ["bat_avg", "타율"],
  ["bat_h", "안타"],
  ["bat_hr", "홈런"],
  ["bat_rbi", "타점"],
  ["bat_r", "득점"],
  ["bat_sb", "도루"],
  ["bat_obp", "출루율"],
  ["bat_slg", "장타율"],
  ["bat_ops", "OPS"],
];

/**
 * 비교할 두 선수를 주소(left·right = 선수 id)에서 복원하고, 선택값이 없으면 기본 선수 쌍을 이름으로 찾는다.
 * 두 선수가 모두 정해지면 같은 시즌 기록을 서버 비교 API 로 받는다.
 */
export async function loader({ request }) {
  const { kind, season, get, params } = requestQuery(request);
  const pit = kind === "pit";
  const explicit = params.has("left") || params.has("right");
  /** 기본 비교 선수의 이름으로 그 시즌 기록을 찾는다. */
  const initial = async (name) => (await choices(kind, season, name)).find((r) => r.name === name);
  /** 지정한 선수 id 의 프로필을 찾는다. */
  const byId = async (key) => {
    if (!get(key)) return undefined;
    try {
      const { player } = await api.playerDetail(get(key));
      return {
        player_id: player.id,
        name: player.name,
        position: player.position,
        team_code: player.team_code,
      };
    } catch {
      return undefined;
    }
  };
  const [left, found] = explicit
    ? await Promise.all([byId("left"), byId("right")])
    : await Promise.all([
        initial(pit ? "원태인" : "김도영"),
        initial(pit ? "김택연" : "구자욱"),
      ]);
  const right = found?.player_id === left?.player_id ? undefined : found;
  const records =
    left && right ? await api.compare(kind, season, [left.player_id, right.player_id]) : null;
  return { selected: { left, right }, records };
}

/** 비교할 한쪽의 선수 정보와 선택 버튼. */
function CompareCard({ record: r, onPick }) {
  const { shortTeam } = useReference();
  const { season } = useQuery();
  return (
    <div className="compare-card">
      <div className="badge">{r?.team_code || "—"}</div>
      <div>
        <h2>{r ? r.name : "선수 선택"}</h2>
        <p>
          {r
            ? shortTeam(r.team_code) + " · " + (r.position || "포지션 미제공")
            : "비교할 선수를 선택하세요."}
        </p>
        {r ? <small>{season} 시즌 기록</small> : null}
      </div>
      <button onClick={onPick}>{r ? "선수 변경" : "선수 선택"}</button>
    </div>
  );
}

/** 이름으로 비교 후보를 서버에서 찾아 고르는 창. 반대쪽에 이미 선택된 선수는 고를 수 없다. */
function Picker({ side, other, onClose, onSelect }) {
  const ref = useRef(null);
  const { kind, season } = useQuery();
  const { shortTeam } = useReference();
  const [text, setText] = useState("");
  const [list, setList] = useState({ rows: null, error: false });

  useEffect(() => {
    const dialog = ref.current;
    if (side) {
      setText("");
      setList({ rows: null, error: false });
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [side]);

  // 입력이 멈추고 0.2초 뒤에 검색한다. 늦게 도착한 이전 검색 결과는 버린다.
  useEffect(() => {
    if (!side) return;
    let alive = true;
    const timer = setTimeout(
      () =>
        choices(kind, season, text).then(
          (rows) => alive && setList({ rows, error: false }),
          () => alive && setList({ rows: null, error: true }),
        ),
      text ? 200 : 0,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [side, text, kind, season]);

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
            <button aria-label="닫기" onClick={() => ref.current.close()}>
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
            {list.error ? (
              <Empty title="선수 목록을 불러오지 못했습니다." />
            ) : list.rows && !list.rows.length ? (
              <Empty title="조건에 맞는 선수가 없습니다." />
            ) : (
              (list.rows || []).map((r) => {
                const same = other?.player_id === r.player_id;
                return (
                  <button
                    key={r.player_id}
                    disabled={same}
                    onClick={() => {
                      ref.current.close();
                      onSelect(recordKey(r));
                    }}
                  >
                    <strong>{r.name}</strong>
                    <span>
                      {shortTeam(r.team_code)} · {same ? "이미 선택됨" : r.position || "포지션 미제공"}
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
  const { selected, records } = useLoaderData();
  const { kind, here } = useQuery();
  const navigate = useNavigate();
  const [side, setSide] = useState("");
  const pit = kind === "pit";
  const [left, right] = records || [selected.left, selected.right];
  const keys = pit ? pitCols : batCompare;

  /** 고른 선수를 한쪽에 넣고, 반대쪽 선택은 그대로 주소에 남긴다. */
  const select = (key) => {
    const current = {
      left: selected.left ? recordKey(selected.left) : "",
      right: selected.right ? recordKey(selected.right) : "",
    };
    navigate(here({ ...current, [side]: key }));
  };

  let body;
  if (records)
    body = (
      <DataTable
        caption="선수 비교"
        className="comparison"
        headers={["기록", left.name, right.name]}
        rows={keys.map(([k, n]) => [n, formatStat(k, left[k]), formatStat(k, right[k])])}
      />
    );
  else if (selected.left && selected.right)
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
        <SeasonSelect />
      </Heading>
      <KindTabs />
      <div className="pair">
        <CompareCard record={left} onPick={() => setSide("left")} />
        <CompareCard record={right} onPick={() => setSide("right")} />
      </div>
      {body}
      <p className="meta">
        출전 경기와 {pit ? "이닝" : "타석 수"}가 다릅니다. 누적 기록은 출전 기회와 함께 비교하세요.
      </p>
      <Picker
        side={side}
        other={side === "left" ? selected.right : selected.left}
        onClose={() => setSide("")}
        onSelect={select}
      />
    </div>
  );
}
