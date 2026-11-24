import type { QueryClient } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router";
import { matchQuery } from "@/features/match";
import { isNotFound } from "@/lib";
import { requestQuery } from "@/utils";

/** 경기 상세. 없는 경기(M001)나 잘못된 id 면 notFound. */
export const gameLoader =
  (qc: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    try {
      await qc.ensureQueryData(matchQuery(requestQuery(request).get("id")));
      return { notFound: false };
    } catch (e) {
      if (isNotFound(e)) return { notFound: true };
      throw e;
    }
  };
