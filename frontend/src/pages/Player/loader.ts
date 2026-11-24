import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { playerQuery } from "@/features/player";
import { playerHistoryQuery } from "@/features/record";
import { isNotFound } from "@/lib";
import { requestQuery } from "@/utils";

/** 선수 프로필과 연도별 타격·투구 기록. 없는 선수(P001)면 notFound. */
export const playerLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const id = requestQuery(request).get("id");
    try {
      await Promise.all([
        qc.ensureQueryData(playerQuery(id)),
        qc.ensureQueryData(playerHistoryQuery("bat", id)),
        qc.ensureQueryData(playerHistoryQuery("pit", id)),
      ]);
      return { notFound: false };
    } catch (e) {
      if (isNotFound(e)) return { notFound: true };
      throw e;
    }
  };
