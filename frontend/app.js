import { loadReference } from "./api.js";
import {
  state,
  get,
  h,
  url,
  here,
  link,
  shortTeam,
  searchForm,
  empty,
  next,
} from "./ui.js";
import { home, gamesPage, gamePage, dailyPage } from "./games.js";
import {
  playerPage,
  playerDetail,
  teamPage,
  comparePage,
  searchPage,
  choices,
  pair,
  recordKey,
} from "./seasons.js";

const header = document.querySelector("#header"),
  main = document.querySelector("main"),
  dialog = document.querySelector("#picker");
const routes = {
  home: ["홈", home],
  games: ["경기 기록", gamesPage],
  players: ["선수 기록", playerPage],
  teams: ["팀 기록", teamPage],
  compare: ["선수 비교", comparePage],
  game: ["경기 상세", gamePage],
  player: ["선수 상세", playerDetail],
  daily: ["일별 선수 기록", dailyPage],
  search: ["검색", searchPage],
};
let renderId = 0;
/** 주소의 화면과 조회 조건을 읽어 본문과 메뉴를 그리고, 요청된 스크롤 위치를 복원한다.
 *  화면 데이터는 API 로 받아 오므로, 응답을 기다리는 사이 다른 화면으로 이동했으면 늦게 온 결과는 버린다. */
async function render({ scroll = 0, focus = false } = {}) {
  if (!state.db) return;
  const [page, query] = location.hash.slice(1).replace(/^\//, "").split("?");
  state.page = page || "home";
  state.params = new URLSearchParams(query);
  const navPage =
    { game: "games", player: "players", daily: "home" }[page] || state.page;
  const navigation = Object.keys(routes)
    .slice(0, 5)
    .map(
      (key) =>
        `<a href="${url(key)}" ${key === navPage ? 'aria-current="page"' : ""}>${routes[key][0]}</a>`,
    )
    .join("");
  header.innerHTML = `<div class="wrap topbar">${link(url("home"), "DIAMOND <span>/ KBO</span>", "brand")}<button class="menu-button" aria-controls="site-nav" aria-expanded="false">메뉴</button><nav id="site-nav" aria-label="주 메뉴">${navigation}</nav>${searchForm("global", page === "search" ? get("q") : "", "선수 또는 팀 검색")}</div>`;
  if (dialog.open) dialog.close();
  const route = Object.hasOwn(routes, state.page) ? routes[state.page] : null;
  const id = ++renderId;
  main.setAttribute("aria-busy", "true");
  let html;
  try {
    html = route
      ? await route[1]()
      : empty("페이지를 찾을 수 없습니다.", "", next(url("home"), "홈으로"));
  } catch {
    html = empty(
      "기록을 불러오지 못했습니다.",
      "백엔드 서버(localhost:8080)가 켜져 있는지 확인해 주세요.",
      '<button data-retry>다시 시도</button>',
    );
  }
  if (id !== renderId) return;
  main.removeAttribute("aria-busy");
  main.innerHTML = html;
  document.title = (route?.[0] || "페이지 없음") + " · DIAMOND / KBO";
  if (focus) main.focus({ preventScroll: true });
  window.scrollTo(0, scroll);
}
/** 현재 스크롤 위치를 방문 기록에 저장한 뒤 새 주소의 화면으로 이동한다. */
function navigate(hash) {
  if (hash === location.hash) return;
  history.replaceState({ ...history.state, scroll: scrollY }, "");
  history.pushState({ from: location.hash }, "", hash);
  render({ focus: true });
}
// 브라우저의 뒤로·앞으로 이동 시 해당 화면과 저장된 스크롤 위치를 복원한다.
window.addEventListener("popstate", () =>
  render({ scroll: history.state?.scroll || 0, focus: true }),
);
history.scrollRestoration = "manual";
// 목록 안의 검색은 현재 필터를 유지하고, 상단 통합 검색은 결과 화면으로 이동한다.
document.addEventListener("submit", (e) => {
  const form = e.target.closest("[data-search]");
  if (!form) return;
  e.preventDefault();
  const q = String(new FormData(form).get("q") || "").trim();
  if (form.dataset.search === "local") navigate(here({ q, page: "" }));
  else navigate(url("search", { q }));
});
// 날짜나 드롭다운 필터를 바꾸면 새 조건의 첫 페이지로 이동한다.
document.addEventListener("change", (e) => {
  const key = e.target.dataset.filter;
  if (!key) return;
  if (key === "date" && !e.target.value) return;
  navigate(here({ [key]: e.target.value, page: "" }));
});
let side = "",
  pickId = 0,
  selectedPair = Promise.resolve({});
/** 이름으로 비교 후보를 서버에서 찾고, 반대쪽에 선택된 선수는 선택할 수 없게 한다. */
async function pickList(query) {
  const id = ++pickId;
  const list = dialog.querySelector(".pick-list");
  let rows, other;
  try {
    [rows, other] = await Promise.all([
      choices(query),
      selectedPair.then((p) => p[side === "left" ? "right" : "left"]),
    ]);
  } catch {
    if (id === pickId) list.innerHTML = empty("선수 목록을 불러오지 못했습니다.");
    return;
  }
  if (id !== pickId) return;
  list.innerHTML = rows.length
    ? rows
        .map((r) => {
          const same = other?.player_id === r.player_id;
          return `<button data-record="${h(recordKey(r))}" ${same ? "disabled" : ""}><strong>${h(r.name)}</strong><span>${h(shortTeam(r.team_code))} · ${same ? "이미 선택됨" : h(r.position || "포지션 미제공")}</span></button>`;
        })
        .join("")
    : empty("조건에 맞는 선수가 없습니다.");
}
/** 왼쪽 또는 오른쪽 비교 선수를 바꿀 수 있도록 선택 창을 열고 검색창에 포커스를 둔다. */
function pick(which) {
  side = which;
  selectedPair = pair().catch(() => ({}));
  dialog.innerHTML = `<div class="section-title"><h2 id="picker-title">비교할 선수 선택</h2><button data-close aria-label="닫기">닫기</button></div><input type="search" aria-label="선수 또는 팀 이름" placeholder="선수 또는 팀 이름"><div class="pick-list"></div>`;
  pickList("");
  dialog.showModal();
  dialog.querySelector("input").focus();
}
let typing;
// 선택 창에 입력할 때마다 비교 후보 목록을 갱신한다.
dialog.addEventListener("input", (e) => {
  if (!e.target.matches("input")) return;
  clearTimeout(typing);
  typing = setTimeout(() => pickList(e.target.value), 200);
});
// 화면을 다시 그려도 버튼과 링크가 동작하도록 클릭을 문서에서 받아 처리한다.
document.addEventListener("click", (e) => {
  if (e.target.closest(".menu-button")) {
    const b = header.querySelector(".menu-button");
    b.setAttribute(
      "aria-expanded",
      String(b.getAttribute("aria-expanded") === "false"),
    );
    return;
  }
  if (e.target.closest("[data-close]") || e.target === dialog) {
    dialog.close();
    return;
  }
  const picker = e.target.closest("[data-pick]");
  if (picker) {
    pick(picker.dataset.pick);
    return;
  }
  const record = e.target.closest("[data-record]");
  if (record) {
    dialog.close();
    selectedPair.then((selected) => {
      const params = {
        left: selected.left ? recordKey(selected.left) : "",
        right: selected.right ? recordKey(selected.right) : "",
      };
      navigate(here({ ...params, [side]: record.dataset.record }));
    });
    return;
  }
  if (e.target.closest("[data-retry]")) {
    render();
    return;
  }
  const a = e.target.closest("a");
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0)
    return;
  if (a.classList.contains("skip")) {
    e.preventDefault();
    main.focus();
    return;
  }
  if (
    a.hasAttribute("data-back") &&
    /^#\/(players|daily|home|search|game|compare)/.test(
      history.state?.from || "",
    )
  ) {
    e.preventDefault();
    history.back();
    return;
  }
  if (a.getAttribute("href")?.startsWith("#/")) {
    e.preventDefault();
    navigate(a.getAttribute("href"));
  }
});
// 사진 로딩 오류를 캡처해 실패한 이미지를 숨기고 대체 글자를 보여준다.
document.addEventListener(
  "error",
  (e) => {
    if (e.target instanceof HTMLImageElement) e.target.hidden = true;
  },
  true,
);
/** 팀·시즌 목록을 DB에서 받아 첫 화면을 그리고, 실패하면 재시도 버튼을 제공한다. */
async function start() {
  main.innerHTML =
    '<div class="wrap empty" role="status">경기 기록을 불러오는 중입니다…</div>';
  try {
    state.db = await loadReference();
    render();
  } catch {
    main.innerHTML = empty(
      "기록을 불러오지 못했습니다.",
      "백엔드 서버(localhost:8080)가 켜져 있는지 확인해 주세요.",
      '<button id="retry">다시 시도</button>',
    );
    main.querySelector("#retry").onclick = start;
  }
}
start();
