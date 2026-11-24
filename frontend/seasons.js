import {
  state,
  h,
  get,
  url,
  here,
  link,
  next,
  select,
  teamsSelect,
  season,
  seasonSelect,
  kind,
  tabs,
  heading,
  section,
  empty,
  shortTeam,
  teamId,
  playerLink,
  photo,
  table,
  statHeader,
  searchForm,
  paging,
  pageNumber,
  st,
} from "./ui.js";
import * as api from "./api.js";

const batCols = [
  ["bat_games", "경기"],
  ["bat_ab", "타수"],
  ["bat_h", "안타"],
  ["bat_hr", "홈런"],
  ["bat_rbi", "타점"],
  ["bat_r", "득점"],
  ["bat_avg", "타율"],
  ["bat_obp", "출루율"],
  ["bat_slg", "장타율"],
  ["bat_ops", "OPS"],
];
const pitCols = [
  ["pit_games", "경기"],
  ["pit_outs", "이닝"],
  ["pit_w", "승"],
  ["pit_l", "패"],
  ["pit_sv", "세이브"],
  ["pit_hld", "홀드"],
  ["pit_so", "탈삼진"],
  ["pit_bb", "볼넷"],
  ["pit_h", "피안타"],
  ["pit_er", "자책"],
  ["pit_era", "ERA"],
];
const detailBat =
  "avg games pa ab r h 2b 3b hr tb rbi sb cs bb hbp so gdp slg obp e ops".split(
    " ",
  );
const detailPit =
  "era games cg sho w l sv hld wpct tbf outs h hr bb hbp so r er".split(" ");
const abbr = { games: "G", outs: "IP", wpct: "WPCT" };
/** 화면 열 이름(bat_avg, pit_outs) → 선수 기록 API 의 정렬 키(avg, innings). */
function sortKey(col) {
  const pit = col.startsWith("pit_"),
    key = col.slice(4);
  const field = (pit ? api.pitKeys : api.batKeys)[key];
  return field === "outs" ? "innings" : field;
}
/** 검색 문자열의 유니코드 표기, 공백, 영문 대소문자 차이를 정규화한다. */
function norm(s) {
  return String(s || "")
    .normalize("NFKC")
    .replace(/\s/g, "")
    .toLowerCase();
}
/** 이름이나 팀명에 정규화한 검색어가 포함되는지 확인한다. */
function includes(value, q) {
  return norm(value).includes(norm(q));
}
/** 시즌·팀·이름·최소 출전 조건과 정렬·페이지를 서버(SQL)에 넘겨 선수 기록 목록을 만든다. */
async function playerPage() {
  const pit = kind() === "pit",
    cols = pit ? pitCols : batCols;
  const sort = cols.some(([k]) => k === get("sort"))
    ? get("sort")
    : pit
      ? "pit_era"
      : "bat_avg";
  const asc = get("dir") ? get("dir") === "asc" : sort === "pit_era";
  const team = get("team"),
    // KBO 기록실처럼 처음에는 규정타석(팀 경기 수 × 3.1)·규정이닝(팀 경기 수 × 1) 이상만 보여 준다.
    // 이름으로 찾을 때는 규정 미달 선수도 나오도록 제한을 풀어 둔다.
    minChoice = get("min", get("q").trim() ? "0" : "q");
  const standing = await api.standings(season());
  const teamGames = Math.max(
    0,
    ...standing
      .filter((r) => !team || r.team_code === team)
      .map((r) => Number(r.games)),
  );
  const qualified = pit ? teamGames : Math.floor(teamGames * 3.1);
  const min = minChoice === "q" ? qualified : Number(minChoice) || 0;
  const params = {
    season: season(),
    teamId: teamId(team),
    keyword: get("q").trim(),
    [pit ? "minInnings" : "minPa"]: min || "",
    sort: sortKey(sort),
    order: asc ? "asc" : "desc",
    size: 25,
  };
  let result = await api.seasonRanking(kind(), {
    ...params,
    page: pageNumber() - 1,
  });
  const last = Math.max(1, Math.ceil(result.total / 25));
  if (pageNumber() > last)
    result = await api.seasonRanking(kind(), { ...params, page: last - 1 });
  const rows = result.rows;
  const { offset, controls } = paging(result.total);
  return `<div class="wrap page">${heading("선수 기록", "시즌별 타자·투수 기록을 확인하세요.", seasonSelect())}${tabs()}
  <div class="toolbar filters"><div class="controls">${teamsSelect()}${select("min", pit ? "최소 이닝" : "최소 타석", [...(qualified ? [["q", pit ? `규정이닝 이상 (${qualified}이닝)` : `규정타석 이상 (${qualified}타석)`]] : []), ["0", pit ? "이닝 제한 없음" : "타석 제한 없음"], ...[pit ? 10 : 50, pit ? 50 : 100, pit ? 100 : 300].map((n) => [n, n + (pit ? "이닝 이상" : "타석 이상")])], minChoice)}</div>${searchForm("local", get("q"), "선수 이름 검색")}</div>
  ${section(pit ? "투수 기록" : "타자 기록", `<span class="count">${result.total}개 기록</span>`)}
  ${
    rows.length
      ? table(
          [
            "순번",
            "선수",
            "팀",
            ...cols.map(([k, n]) =>
              statHeader(k, n, sort, asc, k === "pit_era"),
            ),
          ],
          rows.map((r, i) => [
            offset + i + 1,
            playerLink(r.player_id, r.name),
            h(shortTeam(r.team_code)),
            ...cols.map(([k]) => st(k, r[k])),
          ]),
          "시즌 선수 기록",
          "records",
        ) + controls
      : empty(
          "조건에 맞는 선수가 없습니다.",
          "팀 또는 선수 이름을 변경해 보세요.",
          next(
            url("players", { type: kind(), season: season() }),
            "필터 초기화",
          ),
        )
  }</div>`;
}
/** 선수 ID에 해당하는 프로필과 연도별 성적을 표시하며 이적 시즌의 팀별 기록을 구분한다. */
async function playerDetail() {
  let detail;
  try {
    detail = await api.playerDetail(get("id"));
  } catch (e) {
    if (e instanceof api.ApiError && [400, 404].includes(e.status))
      return empty(
        "선수를 찾을 수 없습니다.",
        "",
        next(url("players"), "선수 기록 보기"),
      );
    throw e;
  }
  const p = detail.player;
  const byType = { bat: detail.bat, pit: detail.pit };
  const type = byType[kind()].length
      ? kind()
      : byType.bat.length
        ? "bat"
        : "pit",
    bat = type === "bat";
  const keys = bat ? detailBat : detailPit;
  const rows = byType[type]
    .slice()
    .sort(
      (a, b) =>
        Number(b.season) - Number(a.season) ||
        a.team_code.localeCompare(b.team_code),
    );
  const headingType = bat ? "타격" : "투구";
  const target = rows.find((r) => r.season === season()) || rows[0];
  return `<div class="wrap page"><a class="back" data-back href="${h(url("players", { type, season: season() }))}">‹ 선수 기록</a>
  <section class="profile">${photo(p)}<div><p class="meta">선수 프로필</p><h1>${h(p.name)}</h1><p>${h(shortTeam(p.team_code))} · ${h(p.position || "포지션 미제공")} · ${h(p.throw_bat || "투타 미제공")}</p><small>마지막 기록상 소속 기준</small></div><dl><dt>생년월일</dt><dd>${h(p.birth_date || "—")}</dd><dt>신장 / 체중</dt><dd>${p.height ? h(p.height) + "cm" : "—"} / ${p.weight ? h(p.weight) + "kg" : "—"}</dd></dl></section>
  ${byType.bat.length && byType.pit.length ? tabs() : ""}${section("연도별 " + headingType + " 기록", target ? next(url("compare", { type, season: target.season, left: recordKey(target) }), "선수 비교") : "")}
  ${
    rows.length
      ? table(
          ["연도", "팀명", ...keys.map((k) => abbr[k] || k.toUpperCase())],
          rows.map((r) => [
            r.season,
            h(shortTeam(r.team_code)),
            ...keys.map((k) => st(type + "_" + k, r[type + "_" + k])),
          ]),
          "연도별 선수 기록",
          "records",
        )
      : empty("수집된 시즌 기록이 없습니다.")
  }<p class="meta">팀명은 해당 시즌 기록의 소속팀입니다. 미제공 값은 —로 표시합니다.</p></div>`;
}
/** 시즌 기준일의 순위를 표시하고 선택한 팀의 최근 10경기 성적과 연속 기록을 보여준다. */
async function teamPage() {
  const rows = await api.standings(season());
  const selected = rows.find((r) => r.team_code === get("team")) || rows[0];
  const content = rows.length
    ? `<div class="table-scroll"><table class="standings"><caption class="sr">정규시즌 팀 순위</caption><thead><tr>${["순위", "팀", "경기", "승", "패", "무", "승률", "게임 차", "최근 10경기", "연속"].map((v) => `<th scope="col">${v}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr class="${r === selected ? "chosen" : ""}"><td>${h(r.team_rank)}</td><td>${link(here({ team: r.team_code }), h(state.db.team.get(r.team_code)?.name || r.team_code), "player-link")}</td>${["games", "wins", "losses", "draws", "win_pct", "games_behind", "last10", "streak"].map((k) => `<td>${st(k, r[k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
  <div class="team-detail"><div><h3>${h(state.db.team.get(selected.team_code)?.name)}</h3><small>선택한 팀</small></div><p>${h(selected.games)}경기 · 게임 차 ${h(selected.games_behind)}</p><div><span>최근 10경기 ${h(selected.last10)}</span><b>${h(selected.streak)}</b></div></div>${next(url("players", { team: selected.team_code, season: season() }), "소속 선수 시즌 기록")}</div>`
    : empty("해당 시즌의 순위가 없습니다.") + "</div>";
  return `<div class="wrap page">${heading("팀 기록", "정규시즌 순위", seasonSelect())}<p class="meta">기준일 ${h(rows[0]?.as_of_date?.replaceAll("-", ".") || "—")}</p>${content}`;
}
/** 비교 선수는 DB 선수 id 로 주소에 남긴다. */
const recordKey = (r) => String(r.player_id);
/** 이름이나 팀으로 현재 시즌의 비교 후보를 서버에서 찾는다 (이름순, 최대 100명). */
async function choices(query = "") {
  const { rows } = await api.seasonRanking(kind(), {
    season: season(),
    keyword: query.trim(),
    sort: "name",
    order: "asc",
    size: 100,
    page: 0,
  });
  return rows;
}
/** 비교할 두 선수를 주소에서 복원하고, 선택값이 없으면 시안의 기본 선수 쌍을 이름으로 찾는다. */
async function pair() {
  const pit = kind() === "pit";
  const explicit = state.params.has("left") || state.params.has("right");
  /** 기본 비교 선수의 이름으로 현재 시즌의 기록을 찾는다. */
  const initial = async (name) =>
    (await choices(name)).find((r) => r.name === name);
  /** 지정한 선수 id 의 프로필을 찾는다. */
  const byId = async (key) => {
    if (!get(key)) return undefined;
    try {
      const { player } = await api.playerDetail(get(key));
      return { player_id: player.id, name: player.name, position: player.position, team_code: player.team_code };
    } catch {
      return undefined;
    }
  };
  const [left, right] = explicit
    ? await Promise.all([byId("left"), byId("right")])
    : await Promise.all([
        initial(pit ? "원태인" : "김도영"),
        initial(pit ? "김택연" : "구자욱"),
      ]);
  return {
    left,
    right: right?.player_id === left?.player_id ? undefined : right,
  };
}
/** 두 선수의 같은 시즌 기록을 서버 비교 API로 받아 지표별로 나란히 표시한다. */
async function comparePage() {
  const { left: l, right: r } = await pair(),
    pit = kind() === "pit";
  const records =
    l && r ? await api.compare(kind(), season(), [l.player_id, r.player_id]) : null;
  const [left, right] = records ? records : [l, r];
  /** 비교할 한쪽의 선수 정보와 선택 버튼을 표시한다. */
  const card = (r, side) =>
    `<div class="compare-card"><div class="badge">${h(r?.team_code || "—")}</div><div><h2>${h(r ? r.name : "선수 선택")}</h2><p>${r ? h(shortTeam(r.team_code) + " · " + (r.position || "포지션 미제공")) : "비교할 선수를 선택하세요."}</p>${r ? `<small>${h(season())} 시즌 기록</small>` : ""}</div><button data-pick="${side}">${r ? "선수 변경" : "선수 선택"}</button></div>`;
  const keys = pit
    ? pitCols
    : [
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
  return `<div class="wrap page">${heading("선수 비교", "같은 시즌, 두 선수의 기록을 나란히 살펴보세요.", seasonSelect())}${tabs()}<div class="pair">${card(left, "left")}${card(right, "right")}</div>
  ${
    records
      ? table(
          ["기록", h(left.name), h(right.name)],
          keys.map(([k, n]) => [n, st(k, left[k]), st(k, right[k])]),
          "선수 비교",
          "comparison",
        )
      : l && r
        ? empty("두 선수 중 이 시즌 기록이 없는 선수가 있습니다.", "시즌을 바꾸거나 다른 선수를 선택해 보세요.")
        : empty("두 선수를 선택하면 비교 기록이 표시됩니다.")
  }
  <p class="meta">출전 경기와 ${pit ? "이닝" : "타석 수"}가 다릅니다. 누적 기록은 출전 기회와 함께 비교하세요.</p></div>`;
}
/** 통합 검색어로 팀과 선수를 찾아 각각 순위표와 개인 상세 화면으로 연결한다. 선수는 서버에서 찾는다. */
async function searchPage() {
  const q = get("q").trim(),
    found = q
      ? await api.searchPlayers(q, pageNumber() - 1, 25)
      : { rows: [], total: 0 },
    players = found.rows,
    teams = q
      ? state.db.teams.filter((t) => includes(t.name + t.short_name, q))
      : [];
  const { controls } = paging(found.total);
  return `<div class="wrap page">${heading("검색 결과", q ? "“" + q + "” 검색 결과" : "선수 또는 팀 이름을 입력하세요.")}${searchForm("global", q, "선수 또는 팀 검색")}
  ${!players.length && !teams.length ? empty(q ? "검색 결과가 없습니다." : "선수·팀 검색", "선수 이름이나 구단명으로 검색해 보세요.") : ""}
  ${teams.length ? section("팀", `<span class="count">${teams.length}팀</span>`) + teams.map((t) => link(url("teams", { team: t.code, season: season() }), `<strong>${h(t.name)}</strong><span>팀 기록 →</span>`, "result")).join("") : ""}
  ${
    players.length
      ? section("선수", `<span class="count">${found.total}명</span>`) +
        players
          .map((p) =>
            link(
              url("player", {
                id: p.id,
                type: p.type,
              }),
              `<strong>${h(p.name)}</strong><span>${h(shortTeam(p.team_code))} · ${h(p.position)} →</span>`,
              "result",
            ),
          )
          .join("") +
        controls
      : ""
  }</div>`;
}

export {
  playerPage,
  playerDetail,
  teamPage,
  comparePage,
  searchPage,
  choices,
  pair,
  recordKey,
  includes,
};
