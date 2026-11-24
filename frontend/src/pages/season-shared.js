/** 선수 기록·선수 상세·선수 비교가 함께 쓰는 시즌 기록 열. */
import * as api from "../lib/api.js";

export const batCols = [
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
export const pitCols = [
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

/** 화면 열 이름(bat_avg, pit_outs) → 선수 기록 API 의 정렬 키(avg, innings). */
export function sortKey(col) {
  const pit = col.startsWith("pit_");
  const field = (pit ? api.pitKeys : api.batKeys)[col.slice(4)];
  return field === "outs" ? "innings" : field;
}

/** 비교 선수는 DB 선수 id 로 주소에 남긴다. */
export const recordKey = (r) => String(r.player_id);

/** 이름이나 팀으로 그 시즌의 비교 후보를 서버에서 찾는다 (이름순, 최대 100명). */
export async function choices(kind, season, query = "") {
  const { rows } = await api.seasonRanking(kind, {
    season,
    keyword: query.trim(),
    sort: "name",
    order: "asc",
    size: 100,
    page: 0,
  });
  return rows;
}
