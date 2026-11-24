/** 화면 공통 타입. */

/** 화면의 기록 종류: 타자(bat) · 투수(pit). 주소의 type 값과 같다. */
export type Kind = "bat" | "pit";

/**
 * 기록 값의 표시 형식.
 * - int: 그대로 (기본)
 * - rate: 타율·출루율·승률처럼 소수 셋째 자리, 앞의 0 생략 (.300)
 * - era: 평균자책점 소수 둘째 자리 (2.25)
 * - outs: 아웃 수를 분수 이닝으로 (19 → 6⅓)
 */
export type StatFormat = "int" | "rate" | "era" | "outs";

/** 기록표 열: 표 머리글, 값을 꺼내는 함수, 표시 형식. key 는 주소의 sort 값(시즌 기록은 서버 정렬 키와 같다). */
export interface Column<T, K extends string = string> {
  key: K;
  label: string;
  get: (row: T) => number | string | null;
  format?: StatFormat;
}
