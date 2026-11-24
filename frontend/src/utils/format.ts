/** 화면 표시용 변환: 기록 값 형식, 날짜, 정렬, 외부 주소 검사, 검색어 비교. */
import type { StatFormat } from "@/types";


/** 결측값(null·undefined·빈 문자열)은 —, 기록된 0은 0으로 표시한다. */
export function formatStat(value: unknown, format: StatFormat = "int"): string {
  if (value == null || value === "") return "—";
  const n = Number(value);
  switch (format) {
    case "outs":
      return Math.floor(n / 3) + (["", "⅓", "⅔"][n % 3] ?? "");
    case "era":
      return n.toFixed(2);
    case "rate":
      return n.toFixed(3).replace(/^0\./, ".");
    default:
      return String(value);
  }
}

/** 0은 유효한 기록이므로 null, undefined 와 빈 문자열만 결측값으로 본다. */
const missing = (v: unknown) => v == null || v === "";

/** 숫자 기록으로 정렬한 복사본. 결측값은 끝에 두고 동률이면 보조 지표의 큰 값을 우선한다. */
export function sortBy<T>(
  rows: readonly T[],
  get: (row: T) => unknown,
  ascending = false,
  tie?: (row: T) => unknown,
): T[] {
  return [...rows].sort((a, b) => {
    const x = get(a);
    const y = get(b);
    if (missing(x) || missing(y)) return Number(missing(x)) - Number(missing(y));
    const diff = Number(x) - Number(y);
    return (ascending ? diff : -diff) || (tie ? Number(tie(b)) - Number(tie(a)) : 0);
  });
}

/** 시간대 변환으로 날짜가 밀리지 않도록 UTC 기준으로 일수를 더해 YYYY-MM-DD를 반환한다. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 날짜를 2025.06.01 (일) 형식으로, long 이면 6월 1일 형식으로 표시한다. */
export function displayDate(value: string, long = false): string {
  const d = new Date(value + "T12:00:00Z");
  return long
    ? `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`
    : value.replaceAll("-", ".") + ` (${"일월화수목금토"[d.getUTCDay()]})`;
}

/** 브라우저 시간대 기준 오늘 날짜(YYYY-MM-DD). */
export function localToday(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

/** 외부 사진과 영상에 사용할 수 있는 절대 HTTP·HTTPS 주소만 반환한다. */
export function safeLink(value: string | null | undefined): string {
  try {
    const url = new URL(value ?? "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

/** 검색 문자열의 유니코드 표기, 공백, 영문 대소문자 차이를 정규화한다. */
function norm(s: string | null | undefined): string {
  return String(s || "")
    .normalize("NFKC")
    .replace(/\s/g, "")
    .toLowerCase();
}

/** 이름이나 팀명에 정규화한 검색어가 포함되는지 확인한다. */
export function includes(value: string, q: string): boolean {
  return norm(value).includes(norm(q));
}
