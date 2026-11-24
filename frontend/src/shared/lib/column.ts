import type { StatFormat } from "./format";

/** 기록표 열: 표 머리글, 값을 꺼내는 함수, 표시 형식. key 는 주소의 sort 값(시즌 기록은 서버 정렬 키와 같다). */
export interface Column<T, K extends string = string> {
  key: K;
  label: string;
  get: (row: T) => number | string | null;
  format?: StatFormat;
}
