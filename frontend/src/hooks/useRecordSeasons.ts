import { useSuspenseQuery } from "@tanstack/react-query";
import { recordSeasonsQuery } from "@/features/record";

/** 선수 기록이 있는 시즌 (선수 기록·비교 화면의 시즌 선택기). 루트 로더가 미리 받아 둔다. */
export function useRecordSeasons(): string[] {
  return useSuspenseQuery(recordSeasonsQuery()).data.map(String);
}
