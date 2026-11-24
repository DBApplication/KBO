/** 주소(해시 라우터의 경로·쿼리)를 읽고 만드는 함수. 로더와 컴포넌트가 같은 규칙을 쓰도록 한 곳에 둔다. */
import { DEFAULT_DATE, DEFAULT_SEASON, PAGE_SIZE } from "@/constants";
import type { Kind } from "@/types";

export type UrlParams = Record<string, string | number | null | undefined>;

/** 비어 있는 조회 조건을 제외하고 화면 이동에 사용할 경로를 만든다. 예) to(ROUTES.PLAYERS, { season: 2025 }) */
export function to(page: string, params: UrlParams = {}): string {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") query.set(k, String(v));
  return `/${page}${query.size ? "?" + query : ""}`;
}

/** 주소의 날짜 형식과 실제 달력 날짜를 검사하고 유효하지 않으면 기본 경기일을 반환한다. */
export function validDate(value: string): string {
  const v = value || DEFAULT_DATE;
  const d = new Date(v + "T12:00:00Z");
  return /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(+d) &&
    d.toISOString().slice(0, 10) === v
    ? v
    : DEFAULT_DATE;
}

export interface UrlQuery {
  params: URLSearchParams;
  /** 주소의 조회 조건. 없으면 fallback */
  get: (key: string, fallback?: string) => string;
  season: string;
  kind: Kind;
  date: string;
  /** 1부터 */
  page: number;
}

/** URLSearchParams 에서 화면 공통 조회 조건(시즌·기록 종류·날짜·페이지)을 읽는다. */
export function readQuery(params: URLSearchParams): UrlQuery {
  const get = (key: string, fallback = "") => params.get(key) || fallback;
  return {
    params,
    get,
    season: get("season", DEFAULT_SEASON),
    kind: get("type") === "pit" ? "pit" : "bat",
    date: validDate(get("date")),
    page: Math.max(1, parseInt(get("page"), 10) || 1),
  };
}

/** 로더의 Request 에서 조회 조건을 읽는다. */
export function requestQuery(request: Request): UrlQuery {
  return readQuery(new URL(request.url).searchParams);
}

/** 요청한 페이지를 유효 범위로 제한해 첫 행 위치와 전체 페이지 수를 반환한다. */
export function paging(total: number, page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(pages, Math.max(1, page));
  return { offset: (current - 1) * size, current, pages };
}

/** 주소 첫 단계로 화면 이름을 정한다 ("/" 는 홈). */
export function pageOf(pathname: string): string {
  return pathname.replace(/^\//, "").split("/")[0] || "home";
}
