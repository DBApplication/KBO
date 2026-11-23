/** 화면 공통 계산: 기록 정렬, 표시 형식, 날짜 이동, 외부 주소 검사. 데이터 조회는 api.js 가 맡는다. */

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
