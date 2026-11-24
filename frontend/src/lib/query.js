/** 주소(해시 라우터의 경로·쿼리)를 읽고 만드는 함수. 로더와 컴포넌트가 같은 규칙을 쓰도록 한 곳에 둔다. */

export const DEFAULT_DATE = "2025-06-01";
export const DEFAULT_SEASON = "2025";
export const PAGE_SIZE = 25;

/** 비어 있는 조회 조건을 제외하고 화면 이동에 사용할 경로를 만든다. 예) to("players", { season: 2025 }) */
export function to(page, params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== ""),
  );
  return `/${page}${query.size ? "?" + query : ""}`;
}

/** 주소의 날짜 형식과 실제 달력 날짜를 검사하고 유효하지 않으면 기본 경기일을 반환한다. */
export function validDate(value) {
  const v = value || DEFAULT_DATE;
  const d = new Date(v + "T12:00:00Z");
  return /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(+d) &&
    d.toISOString().slice(0, 10) === v
    ? v
    : DEFAULT_DATE;
}

/** URLSearchParams 에서 화면 공통 조회 조건(시즌·기록 종류·날짜·페이지)을 읽는다. */
export function readQuery(params) {
  const get = (key, fallback = "") => params.get(key) || fallback;
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
export function requestQuery(request) {
  return readQuery(new URL(request.url).searchParams);
}

/** 요청한 페이지를 유효 범위로 제한해 첫 행 위치와 전체 페이지 수를 반환한다. */
export function paging(total, page, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(pages, Math.max(1, page));
  return { offset: (current - 1) * size, current, pages };
}
