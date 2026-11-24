/**
 * 백엔드(Spring + PostgreSQL) 조회 API 호출과 응답 변환.
 * 화면 코드는 예전 CSV 행과 같은 이름(snake_case)의 객체를 받도록 여기서 한 번만 변환한다.
 * 개발 서버(npm run dev)와 미리보기(npm run preview)는 /api 를 localhost:8080 으로 넘긴다 (vite.config.js).
 */

/** API 오류를 화면에서 구분할 수 있도록 HTTP 상태와 서버 오류 코드를 함께 담는다. */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || "API 오류 " + status);
    this.status = status;
    this.code = code;
  }
}

// 기록 데이터는 조회만 하므로 같은 주소는 한 번만 받는다. 화면을 오갈 때 다시 요청하지 않는다.
const cache = new Map();

/** 빈 값은 빼고 쿼리 문자열을 만든다. */
function query(params = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== ""),
  );
  return q.size ? "?" + q : "";
}

/** GET /api 요청을 보내고 JSON 을 돌려준다. 실패하면 ApiError 를 던진다. */
export function getJSON(path, params) {
  const key = "/api" + path + query(params);
  if (!cache.has(key)) {
    const request = fetch(key, { headers: { Accept: "application/json" } })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new ApiError(res.status, body?.code, body?.message);
        return body;
      })
      .catch((e) => {
        cache.delete(key); // 실패한 요청은 다시 시도할 수 있게 남기지 않는다
        throw e;
      });
    cache.set(key, request);
  }
  return cache.get(key);
}

/** 테스트에서 요청 캐시를 비운다. */
export function clearCache() {
  cache.clear();
}

// ------------------------------------------------------------------ 변환
const team = (t) =>
  t && {
    id: t.id,
    code: t.code,
    name: t.name,
    short_name: t.shortName,
    logo_url: t.logoUrl,
  };

/** 경기 요약 → 경기 행. id 는 DB 경기 id, 시각은 HH:MM. */
export function toGame(m) {
  return {
    id: m.id,
    kbo_game_id: m.kboGameId,
    season: String(m.season),
    match_date: m.matchDate,
    match_time: m.matchTime ? m.matchTime.slice(0, 5) : "",
    home_team_code: m.homeTeam?.code,
    away_team_code: m.awayTeam?.code,
    home_score: m.homeScore,
    away_score: m.awayScore,
    stadium: m.stadium,
    status: m.status,
    doubleheader: m.doubleheader,
    ticket_url: m.actions?.ticketUrl || "",
    actions: m.actions || {},
    highlight_count: m.highlightCount || 0,
  };
}

/** 경기별 타자 기록 → 일별·출전 선수 행. 선수 확인이 안 된 기록은 player_id 가 비어 있다. */
export function toBatterGame(r) {
  return {
    match_id: r.matchId,
    team_code: r.team?.code,
    team_name: r.team?.shortName,
    player_id: r.player?.id ?? "",
    player_name: r.playerName,
    image_url: r.player?.imageUrl || "",
    at_bats: r.ab,
    hits: r.hits,
    home_runs: r.homeRuns,
    rbi: r.rbi,
    runs: r.runs,
    ops: r.ops,
  };
}

/** 경기별 투수 기록 → 일별·출전 선수 행. 이닝은 아웃 수로 둔다. */
export function toPitcherGame(r) {
  return {
    match_id: r.matchId,
    team_code: r.team?.code,
    team_name: r.team?.shortName,
    player_id: r.player?.id ?? "",
    player_name: r.playerName,
    image_url: r.player?.imageUrl || "",
    outs_recorded: r.outs,
    strikeouts: r.strikeouts,
    hits_allowed: r.hitsAllowed,
    earned_runs: r.earnedRuns,
    pitches: r.pitches,
    game_era: r.era,
  };
}

// 화면의 기록 열 이름 ↔ API 기록 필드·정렬 키
export const batKeys = {
  avg: "avg",
  games: "games",
  pa: "pa",
  ab: "ab",
  r: "runs",
  h: "hits",
  "2b": "doubles",
  "3b": "triples",
  hr: "homeRuns",
  tb: "totalBases",
  rbi: "rbi",
  sb: "stolenBases",
  cs: "caughtStealing",
  bb: "walks",
  hbp: "hitByPitch",
  so: "strikeouts",
  gdp: "gdp",
  slg: "slg",
  obp: "obp",
  e: "errors",
  ops: "ops",
};
export const pitKeys = {
  era: "era",
  games: "games",
  cg: "completeGames",
  sho: "shutouts",
  w: "wins",
  l: "losses",
  sv: "saves",
  hld: "holds",
  wpct: "winPct",
  tbf: "battersFaced",
  outs: "outs",
  h: "hits",
  hr: "homeRuns",
  bb: "walks",
  hbp: "hitByPitch",
  so: "strikeouts",
  r: "runs",
  er: "earnedRuns",
};

/** 시즌 기록(타자 bat / 투수 pit) → bat_avg, pit_era 같은 열 이름의 행. */
export function toSeasonRecord(type, item) {
  const keys = type === "bat" ? batKeys : pitKeys;
  const row = {
    player_id: item.player?.id,
    name: item.player?.name,
    position: item.player?.position,
    team_code: item.team?.code,
    season: String(item.season ?? ""),
  };
  for (const [k, field] of Object.entries(keys))
    row[type + "_" + k] = item.stats?.[field];
  return row;
}

/** 선수 프로필. */
export function toPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    type: p.type === "PITCHER" ? "pit" : "bat",
    team_code: p.team?.code,
    position: p.position,
    throw_bat: p.throwBat,
    birth_date: p.birthDate,
    height: p.height,
    weight: p.weight,
    image_url: p.imageUrl,
  };
}

/** 팀 순위 행. */
function toStanding(season, asOfDate, r) {
  return {
    season: String(season),
    as_of_date: asOfDate,
    team_code: r.team?.code,
    team_rank: r.rank,
    games: r.games,
    wins: r.wins,
    losses: r.losses,
    draws: r.draws,
    win_pct: r.winPct,
    games_behind: r.gamesBehind,
    last10: r.last10,
    streak: r.streak,
  };
}

// ------------------------------------------------------------------ 조회
/** 첫 화면 전에 한 번: 팀 목록(필터·팀명 표시)과 기록이 있는 시즌 목록. */
export async function loadReference() {
  const [teams, seasons] = await Promise.all([
    getJSON("/teams"),
    getJSON("/standings/seasons"),
  ]);
  const rows = teams.map(team);
  return {
    teams: rows,
    team: new Map(rows.map((t) => [t.code, t])),
    seasons: seasons.map(String),
  };
}

/** 팀 코드(주소의 team=HT) → DB 팀 id (API 의 teamId 조건용). 코드가 비었거나 없으면 "". */
export async function teamId(code) {
  if (!code) return "";
  return (await loadReference()).team.get(code)?.id ?? "";
}

/** 날짜별 경기 (팀 id·상태 조건은 서버에서 거른다). */
export async function matches(date, { teamId, status } = {}) {
  return (await getJSON("/matches", { date, teamId, status })).map(toGame);
}

/** 경기 상세: 경기·하이라이트·이닝 점수판·주요 기록·출전 선수. */
export async function match(id) {
  const d = await getJSON("/matches/" + encodeURIComponent(id));
  return {
    game: toGame(d.match),
    highlights: d.highlights || [],
    scoreboard: d.scoreboard,
    events: d.events || [],
    batters: (d.batters || []).map(toBatterGame),
    pitchers: (d.pitchers || []).map(toPitcherGame),
  };
}

/** 홈 일별 선수 기록 (그 날 모든 경기). */
export async function dailyRecords(date) {
  const d = await getJSON("/matches/player-records", { date });
  return {
    bat: d.batters.map(toBatterGame),
    pit: d.pitchers.map(toPitcherGame),
  };
}

/** 선수 기록 목록 (서버에서 필터·정렬·페이지). type = bat | pit. */
export async function seasonRanking(type, params) {
  const path = type === "pit" ? "/records/pitchers" : "/records/batters";
  const page = await getJSON(path, params);
  return {
    rows: page.content.map((item) =>
      toSeasonRecord(type, { ...item, season: params.season }),
    ),
    total: page.totalElements,
    page: page.page,
  };
}

/** 선수 상세: 프로필 + 연도별 타격·투구 기록. */
export async function playerDetail(id) {
  const [p, bat, pit] = await Promise.all([
    getJSON("/players/" + encodeURIComponent(id)),
    getJSON(`/players/${encodeURIComponent(id)}/records/batter`),
    getJSON(`/players/${encodeURIComponent(id)}/records/pitcher`),
  ]);
  const player = toPlayer(p);
  const withPlayer = (r) => ({ ...r, player: p });
  return {
    player,
    bat: bat.map((r) => toSeasonRecord("bat", withPlayer(r))),
    pit: pit.map((r) => toSeasonRecord("pit", withPlayer(r))),
  };
}

/** 선수 검색 (헤더 통합 검색). */
export async function searchPlayers(keyword, page, size) {
  const res = await getJSON("/players", { keyword, page, size });
  return { rows: res.content.map(toPlayer), total: res.totalElements };
}

/** 팀 순위. 그 시즌 순위가 없으면 빈 목록. */
export async function standings(season) {
  try {
    const d = await getJSON("/standings", { season });
    return d.standings.map((r) => toStanding(d.season, d.asOfDate, r));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}

/** 두 선수의 같은 시즌 기록 비교. 한쪽이라도 그 시즌 기록이 없으면 null. */
export async function compare(type, season, ids) {
  const path =
    type === "pit" ? "/records/pitchers/compare" : "/records/batters/compare";
  try {
    const items = await getJSON(path, { season, playerIds: ids.join(",") });
    return items.map((item) => toSeasonRecord(type, item));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
