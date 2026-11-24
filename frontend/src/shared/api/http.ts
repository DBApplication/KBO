/**
 * 백엔드(Spring Boot) API 공통 호출. 개발 서버(pnpm dev)와 미리보기(pnpm preview)는
 * /api 를 localhost:8080 으로 넘긴다 (vite.config.ts).
 */
import type { ErrorResponse } from "./types";

/** API 오류. HTTP 상태와 서버 오류 코드(ErrorCode, 예: M001)를 함께 담는다. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  constructor(status: number, code?: string, message?: string) {
    super(message || "API 오류 " + status);
    this.status = status;
    this.code = code;
  }
}

/** 400(잘못된 id 형식)·404(없는 자원)는 화면에서 "찾을 수 없음"으로 보여 준다. */
export function isNotFound(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 400 || e.status === 404);
}

export type Params = Record<string, string | number | null | undefined>;

/** 빈 값은 빼고 쿼리 문자열을 만든다. */
function query(params: Params = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") q.set(k, String(v));
  return q.size ? "?" + q : "";
}

/** GET /api 요청을 보내고 JSON 을 돌려준다. 실패하면 ApiError 를 던진다. */
export async function getJSON<T>(path: string, params?: Params): Promise<T> {
  const res = await fetch("/api" + path + query(params), {
    headers: { Accept: "application/json" },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body as Partial<ErrorResponse> | null;
    throw new ApiError(res.status, err?.code, err?.message);
  }
  return body as T;
}

/** 404 를 null 로 바꾼다 (그 시즌 순위·기록이 없는 경우처럼 "없음"이 정상 결과인 API). */
export async function orNullOn404<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
