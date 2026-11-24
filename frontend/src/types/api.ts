/**
 * 백엔드 공통 응답 타입 (backend/.../global).
 * Java → JSON 변환 규칙: Long·Integer·BigDecimal → number, LocalDate → "YYYY-MM-DD",
 * LocalTime → "HH:MM:SS", 래퍼 타입(Integer 등)과 String 은 null 이 올 수 있다.
 * 도메인 DTO 타입은 같은 폴더의 team.ts · player.ts · match.ts · record.ts · standing.ts 에 있다.
 */

/** YYYY-MM-DD */
export type IsoDate = string;

/** global/dto/PageResponse */
export interface PageResponse<T> {
  content: T[];
  /** 0부터 */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** global/error/ErrorResponse */
export interface ErrorResponse {
  /** ErrorCode 의 코드 (C001, P001, M001, R002 …) */
  code: string;
  message: string;
  status: number;
  errors: { field: string; value: string; reason: string }[];
  timestamp: string;
}
