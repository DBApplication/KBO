import { formatStat, safeLink, shiftDate } from "./records.js";

const DEFAULT_DATE = "2025-06-01";
/** 데이터를 HTML 문자열에 삽입하기 전에 태그와 속성에서 의미가 있는 문자를 이스케이프한다. */
const h = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const state = { db: null, page: "home", params: new URLSearchParams() };
/** 주소에서 조회 조건을 읽고 값이 비어 있으면 기본값을 반환한다. */
function get(key, fallback = "") {
  return state.params.get(key) || fallback;
}
/** 비어 있는 조회 조건을 제외하고 화면 이동에 사용할 해시 주소를 만든다. */
function url(page, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== ""),
  );
  return `#/${page}${query.size ? "?" + query : ""}`;
}
/** 현재 화면의 조회 조건에 변경값만 덮어써 새 주소를 만든다. */
function here(changes) {
  return url(state.page, { ...Object.fromEntries(state.params), ...changes });
}
/** 지정한 주소와 표시용 HTML로 링크를 만든다. 일반 텍스트 레이블은 호출부에서 이스케이프한다. */
function link(href, label, cls = "") {
  return `<a class="${cls}" href="${h(href)}">${label}</a>`;
}
/** 다음 화면으로 이동하는 텍스트 링크에 방향 표시를 붙인다. */
function next(href, label) {
  return link(
    href,
    `${h(label)} <span aria-hidden="true">→</span>`,
    "textlink",
  );
}
/** 유효한 외부 주소를 새 탭에서 여는 링크로 만들고 주소가 없으면 숨긴다. */
function external(raw, label) {
  const href = safeLink(raw);
  return href
    ? `<a class="textlink" href="${h(href)}" target="_blank" rel="noopener noreferrer">${h(label)} <span aria-hidden="true">↗</span></a>`
    : "";
}
/** 현재 선택값을 반영하고 변경할 조회 조건의 키를 지정한 드롭다운을 만든다. */
function select(key, label, values, selected) {
  return `<label class="select"><span class="sr">${h(label)}</span><select data-filter="${h(key)}" aria-label="${h(label)}">${values.map(([v, n]) => `<option value="${h(v)}" ${String(v) === String(selected) ? "selected" : ""}>${h(n)}</option>`).join("")}</select></label>`;
}
/** 전체 팀과 개별 구단을 선택할 수 있는 팀 필터를 만든다. */
function teamsSelect() {
  return select(
    "team",
    "팀 필터",
    [["", "전체 팀"], ...state.db.teams.map((t) => [t.code, t.name])],
    get("team"),
  );
}
/** 주소에서 시즌을 읽고 첫 방문에는 2025시즌을 사용한다. */
function season() {
  return get("season", "2025");
}
/** 수집된 시즌 목록으로 시즌 선택기를 만든다. */
function seasonSelect() {
  return select(
    "season",
    "시즌",
    state.db.seasons.map((s) => [s, s + " 시즌"]),
    season(),
  );
}
/** 주소의 기록 종류를 타자(bat) 또는 투수(pit)로 결정한다. */
function kind() {
  return get("type") === "pit" ? "pit" : "bat";
}
/** 타자·투수 탭을 만들고 전환 시 이전 종류에 종속된 정렬·비교 조건을 초기화한다. */
function tabs() {
  return `<div class="tabs" aria-label="기록 종류">${[
    ["bat", "타자"],
    ["pit", "투수"],
  ]
    .map(([v, n]) =>
      link(
        here({
          type: v,
          sort: "",
          dir: "",
          page: "",
          min: "",
          left: "",
          right: "",
        }),
        n,
        "button " + (kind() === v ? "active" : ""),
      ),
    )
    .join("")}</div>`;
}
/** 화면 제목과 설명을 표시하고 필요한 경우 오른쪽에 날짜나 시즌 선택기를 배치한다. */
function heading(title, sub, control = "") {
  return `<div class="heading"><div><h1>${h(title)}</h1><p>${h(sub)}</p></div>${control}</div>`;
}
/** 구역 제목 옆에 기록 수 또는 전체 보기 링크를 배치한다. */
function section(title, aside = "") {
  return `<div class="section-title"><h2>${h(title)}</h2>${aside}</div>`;
}
/** 자료나 검색 결과가 없을 때 표시할 문구와 이동 동작을 구성한다. */
function empty(title, sub = "", action = "") {
  return `<div class="empty"><strong>${h(title)}</strong>${sub ? `<p>${h(sub)}</p>` : ""}${action}</div>`;
}
/** 날짜를 연·월·일과 요일, 또는 구역 제목용 월·일 형식으로 표시한다. */
function displayDate(value, long = false) {
  const d = new Date(value + "T12:00:00Z");
  return long
    ? `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`
    : value.replaceAll("-", ".") +
        ` (${["일", "월", "화", "수", "목", "금", "토"][d.getUTCDay()]})`;
}
/** 주소의 날짜 형식과 실제 달력 날짜를 검사하고 유효하지 않으면 기본 경기일을 반환한다. */
function date() {
  const v = get("date", DEFAULT_DATE);
  const d = new Date(v + "T12:00:00Z");
  return /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(+d) &&
    d.toISOString().slice(0, 10) === v
    ? v
    : DEFAULT_DATE;
}
/** 선택한 경기일을 기준으로 전날·다음 날 링크와 날짜 입력란을 만든다. */
function dateControl() {
  const d = date();
  return `<div class="date-control">${link(here({ date: shiftDate(d, -1), page: "" }), '<span aria-hidden="true">‹</span><span class="sr">전날</span>')}<label class="date-label">${displayDate(d)}<input type="date" data-filter="date" aria-label="기록 날짜 선택" value="${d}"></label>${link(here({ date: shiftDate(d, 1), page: "" }), '<span aria-hidden="true">›</span><span class="sr">다음 날</span>')}</div>`;
}
/** 팀 코드에서 구단의 짧은 표시명을 찾는다. */
function shortTeam(code) {
  return state.db.team.get(code)?.short_name || code || "—";
}
/** KBO 선수 ID로 이름을 조회하고 미등록 ID에는 안내 문구를 반환한다. */
function playerName(id) {
  return state.db.player.get(id)?.name || "이름 미확인";
}
/** 선수 ID가 확인된 행만 개인 상세로 연결해 동명이인 기록을 잘못 연결하지 않게 한다. */
function playerLink(id, name, type = kind()) {
  return id && state.db.player.has(id)
    ? link(
        url("player", { id, type, season: season() }),
        h(name),
        "player-link",
      )
    : h(name);
}
/** 선수 사진 영역을 만들고 사진이 없거나 로딩에 실패할 때 표시할 대체 글자를 배치한다. */
function photo(p, cls = "") {
  const src = safeLink(p?.image_url);
  return `<div class="portrait ${cls}"><span aria-hidden="true">${h(p?.name?.slice(-2) || "KBO")}</span>${src ? `<img src="${h(src)}" width="94" height="118" loading="lazy" alt="${h(p.name)} 선수 사진">` : ""}</div>`;
}
/** 머리글과 셀 HTML로 접근성용 표 제목과 가로 스크롤 영역을 갖춘 기록표를 만든다. */
function table(headers, rows, caption = "", cls = "") {
  return `<div class="table-scroll"><table class="${cls}"><caption class="sr">${h(caption)}</caption><thead><tr>${headers.map((n) => `<th scope="col">${n}</th>`).join("")}</tr></thead><tbody>${rows.map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
/** 기록표 열 제목을 누르면 해당 지표로 정렬하고, 같은 열을 다시 누르면 방향을 바꾼다. */
function statHeader(key, label, sort, asc, defaultAsc = false) {
  const active = key === sort;
  return link(
    here({
      sort: key,
      dir: (active ? !asc : defaultAsc) ? "asc" : "desc",
      page: "",
    }),
    `${h(label)}${active ? (asc ? " ↑" : " ↓") : ""}`,
    "sort" + (active ? " selected" : ""),
  );
}
/** 검색 범위와 기존 검색어를 유지하는 입력 폼을 만든다. */
function searchForm(key, value, placeholder) {
  return `<form class="search" data-search="${key}" role="search"><input type="search" name="q" aria-label="${h(placeholder)}" placeholder="${h(placeholder)}" value="${h(value)}"><button aria-label="검색"><i class="lens" aria-hidden="true"></i></button></form>`;
}
/** 요청한 페이지를 유효 범위로 제한해 첫 행 위치와 이전·다음 링크를 반환한다. */
function paging(total, size = 25) {
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(pages, Math.max(1, parseInt(get("page"), 10) || 1));
  const controls =
    pages > 1
      ? `<div class="pager">${current > 1 ? link(here({ page: current - 1 }), "이전") : ""}<span>${current} / ${pages}</span>${current < pages ? link(here({ page: current + 1 }), "다음") : ""}</div>`
      : "";
  return { offset: (current - 1) * size, controls };
}
/** 기록값을 지표 형식에 맞게 변환한 뒤 HTML 셀에 넣을 수 있도록 이스케이프한다. */
function st(key, val) {
  return h(formatStat(key, val));
}

export {
  state,
  h,
  get,
  url,
  here,
  link,
  next,
  external,
  select,
  teamsSelect,
  season,
  seasonSelect,
  kind,
  tabs,
  heading,
  section,
  empty,
  displayDate,
  date,
  dateControl,
  shortTeam,
  playerName,
  playerLink,
  photo,
  table,
  statHeader,
  searchForm,
  paging,
  st,
  DEFAULT_DATE,
};
