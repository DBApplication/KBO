import {
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
  kind,
  tabs,
  heading,
  section,
  empty,
  displayDate,
  date,
  dateControl,
  shortTeam,
  playerLink,
  photo,
  table,
  statHeader,
  paging,
  st,
  DEFAULT_DATE,
} from "./ui.js";
import { sortRecords, shiftDate } from "./records.js";

const statuses = {
  FINISHED: "경기 종료",
  CANCELED: "경기 취소",
  SCHEDULED: "경기 예정",
  LIVE: "경기 중",
};
const batDaily = [
  ["at_bats", "타수"],
  ["hits", "안타"],
  ["home_runs", "홈런"],
  ["rbi", "타점"],
  ["runs", "득점"],
  ["ops", "OPS"],
];
const pitDaily = [
  ["outs_recorded", "이닝"],
  ["strikeouts", "탈삼진"],
  ["hits_allowed", "피안타"],
  ["earned_runs", "자책"],
  ["pitches", "투구 수"],
  ["game_era", "ERA"],
];
/** 선택한 날짜에 해당하는 경기 목록을 조회한다. */
function dayGames() {
  return state.db.byDate.get(date()) || [];
}
/** 더블헤더 경기도 구분할 수 있도록 경기 ID를 포함한 상세 주소를 만든다. */
function gameUrl(g) {
  return url("game", { id: g.kbo_game_id, date: g.match_date });
}
/** 구장, 경기 상태, 홈·원정 점수를 한 장의 경기 카드로 표시한다. */
function card(g) {
  /** 지정한 팀의 점수를 표시하고 종료 경기에서 이긴 팀에 승리 표시를 붙인다. */
  const side = (s) => {
    const winner =
      g.status === "FINISHED" &&
      Number(g[s + "_score"]) >
        Number(g[s === "home" ? "away_score" : "home_score"]);
    return `<div class="scoreline ${winner ? "winner" : ""}"><span>${h(shortTeam(g[s + "_team_code"]))} ${winner ? "<b>승</b>" : ""} <small>${s === "away" ? "원정" : "홈"}</small></span><strong>${st("score", g[s + "_score"])}</strong></div>`;
  };
  return link(
    gameUrl(g),
    `<div class="card-meta"><span>${h(g.stadium)}</span><span>${h(statuses[g.status] || g.status)}</span></div>${side("away")}${side("home")}<div class="card-bottom">경기 기록 <span aria-hidden="true">→</span></div>`,
    "game-card",
  );
}
/** 선택한 날짜에 경기 자료가 없을 때 날짜 변경을 안내한다. */
function noGames() {
  return empty(
    "해당 날짜의 경기 기록이 없습니다.",
    "다른 날짜를 선택해 보세요.",
  );
}
/** 일별 출전 기록에 팀·최소 타수 또는 이닝 조건을 적용해 홈 미리보기나 전체 목록을 만든다. */
function daily(full = false) {
  const pit = kind() === "pit",
    cols = pit ? pitDaily : batDaily;
  const all = (pit ? state.db.dailyPit : state.db.dailyBat).filter(
    (r) => r.match_date === date(),
  );
  const minKey = pit ? "outs_recorded" : "at_bats",
    min = get("min", pit ? "0" : "3");
  const selectedSort = cols.some(([k]) => k === get("sort"))
    ? get("sort")
    : pit
      ? "strikeouts"
      : "hits";
  const asc = get("dir") === "asc";
  const rows = sortRecords(
    all.filter(
      (r) =>
        (!get("team") || r.team_code === get("team")) &&
        Number(r[minKey]) >= Number(min),
    ),
    selectedSort,
    asc,
    pit ? "outs_recorded" : "rbi",
  );
  const { offset, controls } = paging(rows.length);
  const count = full ? 25 : 8;
  const headingText = displayDate(date(), true) + " 선수 기록";
  const controlsHTML = `<div class="toolbar">${tabs()}<div class="controls">${teamsSelect()}${select(
    "min",
    "최소 기록",
    pit
      ? [
          ["0", "이닝 제한 없음"],
          ["3", "1이닝 이상"],
          ["15", "5이닝 이상"],
        ]
      : [
          ["0", "타수 제한 없음"],
          ["3", "3타수 이상"],
          ["4", "4타수 이상"],
        ],
    min,
  )}</div></div>`;
  const top = section(
    headingText,
    full
      ? ""
      : next(
          url("daily", {
            ...Object.fromEntries(state.params),
            date: date(),
            page: "",
          }),
          "전체 기록 보기",
        ),
  );
  if (!all.length) {
    const message = dayGames().some((g) => g.status === "FINISHED")
      ? "이 날짜의 일별 선수 기록은 아직 수집되지 않았습니다."
      : "표시할 일별 선수 기록이 없습니다.";
    return (
      top +
      empty(
        message,
        "",
        next(url("home", { date: DEFAULT_DATE }), "6월 1일 기록 보기") +
          " " +
          next(url("players"), "시즌 기록 보기"),
      )
    );
  }
  const shown = rows.slice(full ? offset : 0, (full ? offset : 0) + count);
  return (
    top +
    controlsHTML +
    `<p class="meta">${rows.length}개 출전 기록 · ${shown.length}개 표시</p>` +
    (shown.length
      ? table(
          [
            "순번",
            "선수",
            "팀",
            ...cols.map(([k, n]) =>
              statHeader(k, n, selectedSort, asc, k === "game_era"),
            ),
          ],
          shown.map((r, i) => [
            String((full ? offset : 0) + i + 1),
            playerLink(r.player_id, r.player_name, kind()),
            h(r.team_name),
            ...cols.map(([k]) => st(k, r[k])),
          ]),
          headingText,
          "records",
        ) + (full ? controls : "")
      : empty("조건에 맞는 출전 기록이 없습니다.")) +
    `<p class="meta">${displayDate(date())} 경기 종료 기록 · ${pit ? "이닝은 기록한 아웃 수 기준" : "OPS는 해당 경기 출루율과 장타율의 합"}</p>`
  );
}
/** 선택한 날짜의 경기 카드, 일별 선수 기록, 대표 선수 사진을 홈 화면에 배치한다. */
function home() {
  const games = dayGames();
  const featured = sortRecords(
    state.db.dailyBat.filter(
      (r) => r.match_date === date() && state.db.player.has(r.player_id),
    ),
    "home_runs",
    false,
    "hits",
  )[0];
  const portrait = featured
    ? `<aside class="home-photo">${link(url("player", { id: featured.player_id, type: "bat" }), photo(state.db.player.get(featured.player_id), "hero-photo") + `<div class="photo-caption"><span>${h(featured.team_name)}</span><strong>${h(featured.player_name)}</strong><span aria-hidden="true">↗</span></div>`)}</aside>`
    : "";
  return `<div class="wrap">${heading("KBO 일별 기록", "날짜별 경기 결과와 선수의 기록을 한눈에 확인하세요.", dateControl())}</div>
  <section class="scoreband"><div class="wrap">${section("오늘의 경기", `<span class="count">${games.length}경기</span>` + next(url("games", { date: date() }), "일정 전체 보기"))}${games.length ? `<div class="cards">${games.map(card).join("")}</div>` : noGames()}</div></section>
  <div class="wrap home-body ${portrait ? "with-photo" : ""}"><section>${daily()}</section>${portrait}</div>`;
}
/** 선택 날짜가 속한 주의 월요일부터 일요일까지 날짜 이동 링크를 만든다. */
function week() {
  const day = new Date(date() + "T12:00:00Z").getUTCDay();
  const monday = shiftDate(date(), -((day + 6) % 7));
  return `<div class="week">${Array.from({ length: 7 }, (_, i) => {
    const d = shiftDate(monday, i);
    return link(
      here({ date: d }),
      `<small>${"월화수목금토일"[i]}</small><b>${Number(d.slice(8))}</b>`,
      d === date() ? "active" : "",
    );
  }).join("")}</div>`;
}
/** 영상 한 개는 외부 재생 링크로, 여러 개는 경기 상세의 영상 목록으로 연결한다. */
function highlightLink(g) {
  const videos = state.db.highlights.get(g.kbo_game_id) || [];
  return videos.length === 1
    ? external(videos[0].url, "하이라이트")
    : videos.length
      ? next(gameUrl(g), "하이라이트 목록")
      : "";
}
/** 날짜·팀·경기 상태 조건에 맞는 일정을 표시하고 경기 상세로 연결한다. */
function gamesPage() {
  const rows = dayGames().filter(
    (g) =>
      (!get("team") ||
        [g.home_team_code, g.away_team_code].includes(get("team"))) &&
      (!get("status") || g.status === get("status")),
  );
  const today = new Date(),
    localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return `<div class="wrap page">${heading("경기 기록", "날짜별 경기 결과를 확인하세요.")}<div class="toolbar"><div class="controls">${dateControl()}${link(here({ date: localToday }), "오늘", "button")}</div><div class="controls">${teamsSelect()}${select(
    "status",
    "경기 상태",
    [
      ["", "전체 상태"],
      ["FINISHED", "경기 종료"],
      ["CANCELED", "경기 취소"],
    ],
    get("status"),
  )}</div></div>${week()}${section(displayDate(date(), true) + " 경기", `<span class="count">${rows.length}경기</span>`)}
  ${
    rows.length
      ? table(
          ["시각", "구장", "원정", "점수", "홈", "상태", "기록"],
          rows.map((g) => [
            h(g.match_time) || "—",
            h(g.stadium) +
              (Number(g.doubleheader) ? ` · DH${h(g.doubleheader)}` : ""),
            h(shortTeam(g.away_team_code)),
            `<strong>${st("score", g.away_score)} : ${st("score", g.home_score)}</strong>`,
            h(shortTeam(g.home_team_code)),
            h(statuses[g.status] || g.status),
            `<div class="row-actions">${next(gameUrl(g), "경기 기록")}${highlightLink(g)}</div>`,
          ]),
          "경기 목록",
          "matches",
        )
      : dayGames().length
        ? empty(
            "조건에 맞는 경기가 없습니다.",
            "",
            next(url("games", { date: date() }), "필터 초기화"),
          )
        : noGames()
  }</div>`;
}
/** 경기 ID로 점수, 영상, 이닝별 득점, 주요 기록과 출전 선수를 모아 상세 화면을 만든다. */
function gamePage() {
  const g = state.db.game.get(get("id"));
  if (!g)
    return empty(
      "경기를 찾을 수 없습니다.",
      "",
      next(url("games"), "경기 목록"),
    );
  const id = g.kbo_game_id,
    videos = state.db.highlights.get(id) || [],
    box = state.db.boxes.filter((r) => r.game_id === id);
  const innings = state.db.innings.filter(
    (r) => r.game_id === id && r.raw_value !== "" && r.status !== "not_played",
  );
  const last = Math.max(
    9,
    ...innings
      .filter((r) => !["-", ""].includes(r.raw_value))
      .map((r) => Number(r.inning)),
  );
  const numbers = Array.from({ length: last }, (_, i) => i + 1);
  /** 스코어보드 한쪽에 홈·원정 구분과 팀 이름을 표시한다. */
  const scoreSide = (s) =>
    `<div><small>${s === "away" ? "원정" : "홈"}</small><b>${h(shortTeam(g[s + "_team_code"]))}</b></div>`;
  const eventRows = state.db.events.filter((r) => r.game_id === id);
  const players = (
    kind() === "bat" ? state.db.dailyBat : state.db.dailyPit
  ).filter((r) => r.game_id === id);
  const cols = kind() === "bat" ? batDaily : pitDaily;
  return `<div class="wrap page">${link(url("games", { date: g.match_date }), "‹ 경기 기록", "back")}${heading(shortTeam(g.away_team_code) + " vs " + shortTeam(g.home_team_code), `${displayDate(g.match_date)} · ${g.match_time || "시각 미정"} · ${g.stadium}`)}
  <div class="scoreboard">${scoreSide("away")}<div><small>${h(statuses[g.status] || g.status)}</small><strong>${st("score", g.away_score)} <em>:</em> ${st("score", g.home_score)}</strong></div>${scoreSide("home")}</div>
  ${g.status === "SCHEDULED" ? external(g.ticket_url, "예매하기") : ""}${videos.length ? section("하이라이트") + videos.map((v) => `<div class="video">${external(v.url, v.title)}</div>`).join("") : ""}
  ${
    g.status === "FINISHED"
      ? section("이닝별 기록") +
        (box.length
          ? table(
              ["팀", ...numbers, "R", "H", "E"],
              box.map((r) => [
                h(r.team_name),
                ...numbers.map((i) =>
                  h(
                    innings.find(
                      (n) =>
                        n.team_side === r.team_side && Number(n.inning) === i,
                    )?.raw_value || "—",
                  ),
                ),
                r.runs,
                r.hits,
                r.errors,
              ]),
              "이닝별 득점",
            )
          : empty("이 경기의 이닝별 기록은 아직 수집되지 않았습니다."))
      : ""
  }
  ${
    eventRows.length
      ? section("경기 주요 기록") +
        table(
          ["항목", "기록"],
          eventRows.map((e) => [h(e.event_type), h(e.description)]),
          "경기 주요 기록",
          "events",
        )
      : ""
  }
  ${
    g.status === "FINISHED"
      ? section("출전 선수 기록") +
        tabs() +
        (players.length
          ? table(
              ["선수", "팀", ...cols.map((c) => c[1])],
              players.map((r) => [
                playerLink(r.player_id, r.player_name),
                h(r.team_name),
                ...cols.map(([k]) => st(k, r[k])),
              ]),
              "출전 선수 기록",
            )
          : empty(
              "이 경기의 선수별 기록은 아직 수집되지 않았습니다.",
              "",
              next(url("players", { season: g.season }), "시즌 기록 보기"),
            ))
      : ""
  }</div>`;
}
/** 날짜를 바꾸거나 페이지를 넘겨 전체 일별 출전 기록을 볼 수 있는 화면을 만든다. */
function dailyPage() {
  return `<div class="wrap page">${link(url("home", { date: date() }), "‹ 홈", "back")}<div class="toolbar">${dateControl()}</div>${daily(true)}</div>`;
}

export { home, gamesPage, gamePage, dailyPage };
