/** API 오류. HTTP 상태와 서버 오류 코드(백엔드 ErrorCode, 예: M001)를 함께 담는다. */
export class ApiError extends Error {
  /** HTTP 상태. 서버에 닿지 못한 네트워크 오류는 0 */
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

/** 404 를 null 로 바꾼다 (그 시즌 순위·기록이 없는 경우처럼 "없음"이 정상 결과인 API). */
export async function orNullOn404<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
