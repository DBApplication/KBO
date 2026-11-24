/**
 * 백엔드(Spring Boot) API 클라이언트.
 * 개발 서버(pnpm dev)와 미리보기(pnpm preview)는 /api 를 localhost:8080 으로 넘긴다 (vite.config.ts).
 * 엔드포인트별 호출 함수는 src/api/ 에 있다.
 */
import axios, { AxiosError } from "axios";
import type { ErrorResponse } from "@/types";
import { ApiError } from "./apiError";

export type Params = Record<string, string | number | null | undefined>;

/** 빈 값(null·undefined·"")은 빼고 쿼리 문자열을 만든다. 예) { season: 2025, teamId: "" } → season=2025 */
export function serializeParams(params: Params = {}): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v != null && v !== "") q.set(k, String(v));
  return q.toString();
}

export const apiClient = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/json" },
  paramsSerializer: { serialize: (params) => serializeParams(params as Params) },
});

// 실패 응답은 백엔드 ErrorResponse(code·message)를 담은 ApiError 로 바꿔 화면에서 상태·코드로 구분한다.
apiClient.interceptors.response.use(undefined, (error: unknown) => {
  if (error instanceof AxiosError) {
    const body = error.response?.data as Partial<ErrorResponse> | undefined;
    return Promise.reject(new ApiError(error.response?.status ?? 0, body?.code, body?.message ?? error.message));
  }
  return Promise.reject(error);
});

/** GET 요청을 보내고 응답 본문을 돌려준다. 실패하면 ApiError 를 던진다. */
export async function get<T>(url: string, params?: Params): Promise<T> {
  const { data } = await apiClient.get<T>(url, { params });
  return data;
}
