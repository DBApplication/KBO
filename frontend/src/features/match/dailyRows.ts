import type { DailyPlayerRecords, GameRecord, Kind } from "@/types";
import { sortBy } from "@/utils";
import { gameColumns } from "./columns";

/** 일별 선수 기록 화면의 조회 조건 (주소의 team·min·sort·dir). */
export interface DailyFilter {
  team?: string;
  min?: string;
  sort?: string;
  dir?: string;
}

/**
 * 일별 출전 기록에 팀·최소 기록 조건과 정렬을 적용한 목록.
 * 기록표와 홈의 대표 선수가 같은 기준을 쓰도록 여기 한 곳에서만 계산한다.
 */
export function dailyRows(records: DailyPlayerRecords, kind: Kind, filter: DailyFilter = {}) {
  const pit = kind === "pit";
  const cols = gameColumns(kind);
  const all: GameRecord[] = pit ? records.pitchers : records.batters;
  const minOf = (r: GameRecord) => ("outs" in r ? r.outs : r.ab) ?? 0;
  // 투수는 제한 없음, 타자는 3타수가 기본
  const min = filter.min || (pit ? "0" : "3");
  const sortCol = cols.find((c) => c.key === filter.sort) ?? cols.find((c) => c.key === (pit ? "strikeouts" : "hits"))!;
  const asc = filter.dir === "asc";
  // 동률이면 투수는 이닝, 타자는 타점이 많은 순
  const tie = (r: GameRecord) => ("outs" in r ? r.outs : r.rbi);
  const rows = sortBy(
    all.filter((r) => (!filter.team || r.team?.code === filter.team) && minOf(r) >= Number(min)),
    sortCol.get,
    asc,
    tie,
  );
  return { rows, all, cols, sortCol, asc, min, pit };
}
