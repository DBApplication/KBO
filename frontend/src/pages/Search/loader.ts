import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { requestQuery } from "@/utils";
import { searchOf } from "./searchQuery";

/** 선수는 서버에서 이름으로 찾는다 (팀은 처음 받은 팀 목록에서 화면이 찾는다). */
export const searchLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const { query } = searchOf(requestQuery(request));
    if (query.enabled) await qc.ensureQueryData(query);
    return null;
  };
