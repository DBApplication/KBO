import { useSuspenseQuery } from "@tanstack/react-query";
import { standingSeasonsQuery } from "../api/standings-api";

/** 순위가 있는 시즌 (팀 기록 화면의 시즌 선택기). 루트 로더가 미리 받아 둔다. */
export function useStandingSeasons(): string[] {
  return useSuspenseQuery(standingSeasonsQuery()).data.map(String);
}
