/** CSV 첫 행을 열 이름으로 사용해 각 행을 객체로 읽는다. 따옴표 안의 쉼표와 줄바꿈, 빈 필드를 보존한다. */
export function parseRecords(source) {
  const text = source.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(field);
      field = "";
      if (c === "\n") {
        rows.push(row);
        row = [];
      }
    } else if (quoted || c !== "\r") field += c;
  }
  if (quoted) throw new Error("닫히지 않은 CSV 필드");
  if (field.length || row.length) rows.push([...row, field]);
  const keys = rows.shift() || [];
  return rows
    .filter((r) => r.length > 1)
    .map((r) => {
      if (r.length !== keys.length)
        throw new Error("CSV 열 수가 일치하지 않습니다.");
      return Object.fromEntries(keys.map((key, i) => [key, r[i]]));
    });
}

const files = {
  teams: "team",
  players: "player",
  games: "matches",
  videos: "match_highlight",
  bat: "batter_season_record",
  pit: "pitcher_season_record",
  standings: "team_season_record",
  dailyBat: "daily/batting",
  dailyPit: "daily/pitching",
  innings: "daily/team_innings",
  boxes: "daily/team_game_stats",
  events: "daily/game_events",
};

/** 같은 키 값을 가진 행을 원래 순서대로 묶어 Map으로 반환한다. */
export function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row[key])) groups.set(row[key], []);
    groups.get(row[key]).push(row);
  }
  return groups;
}

/** 경기·선수·팀 CSV를 병렬로 읽고 조회용 인덱스를 갖춘 데이터를 반환한다. */
export async function loadRecords() {
  const entries = await Promise.all(
    Object.entries(files).map(async ([key, file]) => {
      const response = await fetch(
        new URL("./data/" + file + ".csv", document.baseURI),
      );
      if (!response.ok) throw new Error(file);
      return [key, parseRecords(await response.text())];
    }),
  );
  return indexRecords(Object.fromEntries(entries));
}

/** 경기·선수 ID와 팀 코드로 조회 인덱스를 만들고 일별 출전 행에 경기 날짜와 팀 코드를 연결한다. */
export function indexRecords(data) {
  data.team = new Map(data.teams.map((t) => [t.code, t]));
  data.player = new Map(data.players.map((p) => [p.kbo_player_id, p]));
  data.game = new Map(data.games.map((g) => [g.kbo_game_id, g]));
  data.byDate = groupBy(data.games, "match_date");
  data.highlights = groupBy(data.videos, "kbo_game_id");
  data.seasons = [...new Set(data.standings.map((r) => r.season))]
    .sort()
    .reverse();
  const teamCode = new Map(data.teams.map((t) => [t.short_name, t.code]));
  for (const rows of [data.dailyBat, data.dailyPit]) {
    for (const r of rows) {
      r.team_code = teamCode.get(r.team_name);
      r.match_date = data.game.get(r.game_id)?.match_date;
    }
  }
  return data;
}

/** 숫자 기록을 정렬한 복사본을 반환한다. 결측값은 끝에 두고 동률이면 보조 지표의 큰 값을 우선한다. */
export function sortRecords(rows, key, ascending = false, tieKey) {
  /** 0은 유효한 기록이므로 null, undefined와 빈 문자열만 결측값으로 본다. */
  const missing = (v) => v == null || v === "";
  return [...rows].sort((a, b) => {
    if (missing(a[key]) || missing(b[key]))
      return Number(missing(a[key])) - Number(missing(b[key]));
    const diff = Number(a[key]) - Number(b[key]);
    return (
      (ascending ? diff : -diff) ||
      (tieKey ? Number(b[tieKey]) - Number(a[tieKey]) : 0)
    );
  });
}

/** 아웃 수는 분수 이닝으로, ERA와 비율 기록은 정해진 소수 자릿수로, 결측값은 대시로 표시한다. */
export function formatStat(key, value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (key === "pit_outs" || key === "outs_recorded")
    return Math.floor(n / 3) + ["", "⅓", "⅔"][n % 3];
  if (key.includes("era")) return n.toFixed(2);
  if (
    [
      "bat_avg",
      "bat_obp",
      "bat_slg",
      "bat_ops",
      "ops",
      "win_pct",
      "pit_wpct",
      "batting_average",
    ].includes(key)
  )
    return n.toFixed(3).replace(/^0\./, ".");
  return String(value);
}
/** 시간대 변환으로 날짜가 밀리지 않도록 UTC 기준으로 일수를 더해 YYYY-MM-DD를 반환한다. */
export function shiftDate(date, days) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
/** 외부 사진과 영상에 사용할 수 있는 절대 HTTP·HTTPS 주소만 반환한다. */
export function safeLink(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
